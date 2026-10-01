# Mercado Pago no GiroCerto

Aplicação: `7087419125626531`. Cobrança PIX avulsa de R$12,99 para mais 30 dias; não é débito recorrente automático.

## Configuração pelo proprietário

1. Supabase → Edge Functions → Secrets: salvar `MERCADO_PAGO_ACCESS_TOKEN` com o Access Token de produção. Nunca colocar no frontend, GitHub ou chat.
2. Mercado Pago → Suas integrações → GiroCerto → Webhooks: configurar a URL de produção `https://fmzfwgmsgidabqjhmiin.supabase.co/functions/v1/mercadopago-webhook` e selecionar notificações de **Order**, referentes às orders online da API `/v1/orders` (Checkout API/Transparente).
3. Copiar a assinatura secreta desse webhook diretamente para Supabase → Secrets com nome `MERCADO_PAGO_WEBHOOK_SECRET`.
4. Fazer o teste completo com uma conta de cliente separada da conta recebedora: gerar PIX, pagar, conferir o crédito no Mercado Pago, confirmar a extensão do plano em exatamente 30 dias e reenviar a notificação para garantir que não acrescenta outros 30 dias.

Até os dois segredos serem salvos, a tela mantém a chave PIX manual. A presença dos segredos não prova que as credenciais são válidas ou que as notificações estão configuradas. Validar o pagamento real antes de anunciar a integração como pronta.

## Proteções

- Valor definido exclusivamente no servidor, sessão validada com Auth, cobranças vinculadas ao usuário autenticado.
- Clientes apenas leem suas cobranças com RLS; não podem editar preço/status/plano nem executar as funções de ativação.
- Reutilização de intenção sob bloqueio de linha e chave de idempotência do provedor.
- QR com duração de 30 minutos; cobrança pode ser recuperada após recarregar a tela.
- Assinatura HMAC do webhook, ambiente real e ID da aplicação conferidos. Status e valores consultados diretamente no Mercado Pago antes de liberar.
- Ativação transacional sob bloqueio de linha; webhook repetido não prolonga novamente.
- Consultas de tela não liberam sem uma notificação assinada já recebida.
- A chave fixa de e-mail permanece exclusivamente para confirmação manual.

As funções antigas em `api/`, `functions/api/` e `netlify/functions/` não fazem parte desta hospedagem estática e não devem ser ativadas. Este fluxo usa exclusivamente as Edge Functions do Supabase.

## Verificação

`node --test tests/payment-core.test.mjs`, `npx tsc --noEmit`, `npm run build`. A migração está em `db/girocerto-mercadopago.sql`; as Edge Functions estão em `supabase/functions/`.
