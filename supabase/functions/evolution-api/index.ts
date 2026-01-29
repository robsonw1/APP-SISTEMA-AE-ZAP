import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import QRCode from "https://esm.sh/qrcode@1.5.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL") || "";
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY") || "";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const body = req.method !== "GET" ? await req.json() : {};
    const action = body.action;

    console.log(`Evolution API action: ${action}`, body);

    let result;

    switch (action) {
      case "create-instance": {
        const { instanceName, organizationId } = body;
        
        // Create instance in Evolution API
        const response = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
          method: "POST",
          headers: {
            "apikey": EVOLUTION_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            instanceName,
            qrcode: true,
            integration: "WHATSAPP-BAILEYS",
          }),
        });

        const data = await response.json();
        console.log("Create instance response:", data);

        if (!response.ok) {
          throw new Error(data.message || "Failed to create instance");
        }

        // Save to database
        const { data: connection, error: dbError } = await supabaseClient
          .from("whatsapp_connections")
          .insert({
            organization_id: organizationId,
            instance_name: instanceName,
            display_name: instanceName,
            status: "qr_code",
          })
          .select()
          .single();

        if (dbError) throw dbError;

        result = { connection, evolution: data };
        break;
      }

      case "get-qrcode": {
        const { instanceName, connectionId } = body;

        const response = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
          headers: { "apikey": EVOLUTION_API_KEY },
        });

        const data = await response.json();
        console.log("Get QR code response:", data);

        // Evolution API pode retornar em formatos diferentes dependendo da versão/configuração.
        // Prioridade:
        // 1) data.qrcode.base64 (quando já vem o PNG em base64)
        // 2) data.code (conteúdo do QR em string) -> geramos SVG e retornamos como data URL
        let qrValue: string | null = data?.qrcode?.base64 ?? null;

        if (!qrValue && typeof data?.code === "string" && data.code.trim()) {
          const svg = await QRCode.toString(data.code, {
            type: "svg",
            margin: 1,
            errorCorrectionLevel: "M",
          });

          // data:image/svg+xml;base64,...
          // (svg costuma ser ASCII, mas usamos encodeURIComponent para garantir)
          const svgBase64 = btoa(unescape(encodeURIComponent(svg)));
          qrValue = `data:image/svg+xml;base64,${svgBase64}`;
        }

        if (qrValue) {
          // Persistimos para a UI poder reutilizar
          await supabaseClient
            .from("whatsapp_connections")
            .update({ qr_code: qrValue, status: "qr_code" })
            .eq("id", connectionId);
        }

        result = { qrCode: qrValue, instance: data.instance };
        break;
      }

      case "check-status": {
        const { instanceName, connectionId } = body;

        const response = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
          headers: { "apikey": EVOLUTION_API_KEY },
        });

        const data = await response.json();
        console.log("Check status response:", data);

        const isConnected = data.instance?.state === "open";
        
        if (isConnected) {
          // Get instance info for phone number
          const infoResponse = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances?instanceName=${instanceName}`, {
            headers: { "apikey": EVOLUTION_API_KEY },
          });
          const infoData = await infoResponse.json();
          const phoneNumber = infoData[0]?.instance?.owner?.split("@")[0] || null;

          await supabaseClient
            .from("whatsapp_connections")
            .update({ 
              status: "connected", 
              phone_number: phoneNumber,
              last_connected_at: new Date().toISOString(),
              qr_code: null 
            })
            .eq("id", connectionId);
        }

        result = { 
          status: isConnected ? "connected" : data.instance?.state || "disconnected",
          instance: data.instance 
        };
        break;
      }

      case "disconnect": {
        const { instanceName, connectionId } = body;

        const response = await fetch(`${EVOLUTION_API_URL}/instance/logout/${instanceName}`, {
          method: "DELETE",
          headers: { "apikey": EVOLUTION_API_KEY },
        });

        const data = await response.json();
        console.log("Disconnect response:", data);

        await supabaseClient
          .from("whatsapp_connections")
          .update({ status: "disconnected", qr_code: null })
          .eq("id", connectionId);

        result = { success: true };
        break;
      }

      case "delete-instance": {
        const { instanceName, connectionId } = body;

        const response = await fetch(`${EVOLUTION_API_URL}/instance/delete/${instanceName}`, {
          method: "DELETE",
          headers: { "apikey": EVOLUTION_API_KEY },
        });

        const data = await response.json();
        console.log("Delete instance response:", data);

        await supabaseClient
          .from("whatsapp_connections")
          .delete()
          .eq("id", connectionId);

        result = { success: true };
        break;
      }

      case "send-message": {
        const { instanceName, phone, message, mediaUrl, mediaType } = body;

        let endpoint = "sendText";
        let messageBody: Record<string, unknown> = {
          number: phone,
          text: message,
        };

        if (mediaUrl) {
          if (mediaType?.startsWith("image")) {
            endpoint = "sendMedia";
            messageBody = {
              number: phone,
              mediatype: "image",
              media: mediaUrl,
              caption: message,
            };
          } else if (mediaType?.startsWith("audio")) {
            endpoint = "sendWhatsAppAudio";
            messageBody = {
              number: phone,
              audio: mediaUrl,
            };
          } else {
            endpoint = "sendMedia";
            messageBody = {
              number: phone,
              mediatype: "document",
              media: mediaUrl,
              caption: message,
            };
          }
        }

        const response = await fetch(`${EVOLUTION_API_URL}/message/${endpoint}/${instanceName}`, {
          method: "POST",
          headers: {
            "apikey": EVOLUTION_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(messageBody),
        });

        const data = await response.json();
        console.log("Send message response:", data);

        if (!response.ok) {
          throw new Error(data.message || "Failed to send message");
        }

        result = { success: true, messageId: data.key?.id };
        break;
      }

      case "restart-all": {
        const { organizationId } = body;

        // Get all connections for this org
        const { data: connections } = await supabaseClient
          .from("whatsapp_connections")
          .select("*")
          .eq("organization_id", organizationId);

        const results = [];
        for (const conn of connections || []) {
          try {
            await fetch(`${EVOLUTION_API_URL}/instance/restart/${conn.instance_name}`, {
              method: "PUT",
              headers: { "apikey": EVOLUTION_API_KEY },
            });
            results.push({ id: conn.id, success: true });
          } catch (err) {
            results.push({ id: conn.id, success: false, error: String(err) });
          }
        }

        result = { results };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Evolution API error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});