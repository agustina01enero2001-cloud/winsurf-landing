export const DEFAULT_WA_MESSAGES = [
  "Hola, quiero info sobre {{marca}}. Ref: {{twclid}}",
  "Buenas, me interesa conocer {{marca}}. Ref: {{twclid}}",
  "Hola, vi la página de {{marca}} y quiero consultar. Ref: {{twclid}}",
  "Buen día, quiero hablar con un asesor de {{marca}}. Ref: {{twclid}}",
  "Hola, necesito ayuda para crear mi usuario en {{marca}}. Ref: {{twclid}}",
  "Buenas, llegué por la web de {{marca}}. Ref: {{twclid}}",
  "Hola, quiero más información de {{marca}}. Ref: {{twclid}}",
  "Buenas tardes, consulto por {{marca}}. Ref: {{twclid}}",
  "Hola, me interesa el acompañamiento de {{marca}}. Ref: {{twclid}}",
  "Buen día, quiero contactarme con {{marca}}. Ref: {{twclid}}",
] as const;

export const DEFAULT_WA_MESSAGES_BODY = DEFAULT_WA_MESSAGES.join("\n");
