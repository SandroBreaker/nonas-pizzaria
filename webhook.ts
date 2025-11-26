// Edge Function para receber Webhook da Invictus
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const payload = await req.json();
    
    // Verifica se o pagamento foi aprovado
    if (payload.status === 'paid' || payload.status === 'approved') {
        
        // O ID do pedido foi enviado no campo external_reference na criação
        const orderId = payload.external_reference; 
        
        if (orderId) {
            const { error } = await supabase
              .from('orders')
              .update({ 
                  status: 'PAID', 
                  payment_id: payload.id // ID da transação na Invictus
              })
              .eq('id', orderId)

            if (error) throw error;
        }
    }

    return new Response(JSON.stringify({ message: "Webhook processed" }), {
      headers: { "Content-Type": "application/json" },
      status: 200
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
})
