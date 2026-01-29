import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body, null, 2));

    const { event, instance, data } = body;

    // Handle different webhook events
    switch (event) {
      case "messages.upsert": {
        const message = data.message || data;
        const remoteJid = message.key?.remoteJid || data.key?.remoteJid;
        const fromMe = message.key?.fromMe || data.key?.fromMe;
        const content = message.message?.conversation || 
                       message.message?.extendedTextMessage?.text ||
                       message.message?.imageMessage?.caption ||
                       message.message?.videoMessage?.caption ||
                       message.message?.documentMessage?.caption ||
                       "[Mídia]";

        if (!remoteJid || fromMe) {
          console.log("Ignoring outgoing message or invalid jid");
          break;
        }

        // Extract phone number from jid
        const phoneNumber = remoteJid.split("@")[0];
        console.log(`Message from ${phoneNumber}: ${content}`);

        // Find connection by instance name
        const { data: connection } = await supabaseClient
          .from("whatsapp_connections")
          .select("*, organizations(id)")
          .eq("instance_name", instance)
          .single();

        if (!connection) {
          console.error(`Connection not found for instance: ${instance}`);
          break;
        }

        const organizationId = connection.organization_id;

        // Find or create contact
        let { data: contact } = await supabaseClient
          .from("contacts")
          .select("*")
          .eq("organization_id", organizationId)
          .eq("phone", phoneNumber)
          .single();

        if (!contact) {
          const pushName = message.pushName || data.pushName || phoneNumber;
          const { data: newContact, error: contactError } = await supabaseClient
            .from("contacts")
            .insert({
              organization_id: organizationId,
              name: pushName,
              phone: phoneNumber,
            })
            .select()
            .single();

          if (contactError) {
            console.error("Error creating contact:", contactError);
            break;
          }
          contact = newContact;
        }

        // Find or create ticket
        let { data: ticket } = await supabaseClient
          .from("tickets")
          .select("*")
          .eq("organization_id", organizationId)
          .eq("contact_id", contact.id)
          .in("status", ["open", "in_progress", "waiting"])
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (!ticket) {
          const { data: newTicket, error: ticketError } = await supabaseClient
            .from("tickets")
            .insert({
              organization_id: organizationId,
              contact_id: contact.id,
              whatsapp_connection_id: connection.id,
              title: `Atendimento - ${contact.name}`,
              status: "open",
            })
            .select()
            .single();

          if (ticketError) {
            console.error("Error creating ticket:", ticketError);
            break;
          }
          ticket = newTicket;
        }

        // Extract media if present
        let mediaUrl = null;
        let mediaType = null;
        
        if (message.message?.imageMessage) {
          mediaType = "image";
          // In a real implementation, you'd download and store the media
        } else if (message.message?.audioMessage) {
          mediaType = "audio";
        } else if (message.message?.videoMessage) {
          mediaType = "video";
        } else if (message.message?.documentMessage) {
          mediaType = "document";
        }

        // Create message
        const { error: messageError } = await supabaseClient
          .from("messages")
          .insert({
            ticket_id: ticket.id,
            sender_type: "contact",
            content: content,
            media_url: mediaUrl,
            media_type: mediaType,
          });

        if (messageError) {
          console.error("Error creating message:", messageError);
        }

        break;
      }

      case "connection.update": {
        const state = data.state;
        console.log(`Connection update for ${instance}: ${state}`);

        const status = state === "open" ? "connected" : 
                       state === "close" ? "disconnected" : "connecting";

        await supabaseClient
          .from("whatsapp_connections")
          .update({ 
            status,
            last_connected_at: status === "connected" ? new Date().toISOString() : undefined
          })
          .eq("instance_name", instance);

        break;
      }

      case "qrcode.updated": {
        console.log(`QR Code updated for ${instance}`);
        
        if (data.qrcode?.base64) {
          await supabaseClient
            .from("whatsapp_connections")
            .update({ qr_code: data.qrcode.base64, status: "qr_code" })
            .eq("instance_name", instance);
        }

        break;
      }

      default:
        console.log(`Unhandled event: ${event}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});