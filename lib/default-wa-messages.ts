export const DEFAULT_WA_MESSAGES = [
  "Hola, quiero info sobre {{marca}}. Ref: {{twclid}} visit_id: {{vid}}",
  "Buenas, me interesa conocer {{marca}}. Ref: {{twclid}} visit_id: {{vid}}",
  "Hola, vi la página de {{marca}} y quiero consultar. Ref: {{twclid}} visit_id: {{vid}}",
  "Buen día, quiero hablar con un asesor de {{marca}}. Ref: {{twclid}} visit_id: {{vid}}",
  "Hola, necesito ayuda para crear mi usuario en {{marca}}. Ref: {{twclid}} visit_id: {{vid}}",
  "Buenas, llegué por la web de {{marca}}. Ref: {{twclid}} visit_id: {{vid}}",
  "Hola, quiero más información de {{marca}}. Ref: {{twclid}} visit_id: {{vid}}",
  "Buenas tardes, consulto por {{marca}}. Ref: {{twclid}} visit_id: {{vid}}",
  "Hola, me interesa el acompañamiento de {{marca}}. Ref: {{twclid}} visit_id: {{vid}}",
  "Buen día, quiero contactarme con {{marca}}. Ref: {{twclid}} visit_id: {{vid}}",
] as const;

export const DEFAULT_WA_MESSAGES_BODY = DEFAULT_WA_MESSAGES.join("\n");
