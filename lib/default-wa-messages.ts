export const DEFAULT_WA_MESSAGES = [
  "Hola, quiero info sobre {{marca}}. Ref: {{twclid}} o={{o}} so={{so}}",
  "Buenas, me interesa conocer {{marca}}. Ref: {{twclid}} o={{o}} so={{so}}",
  "Hola, vi la página de {{marca}} y quiero consultar. Ref: {{twclid}} o={{o}} so={{so}}",
  "Buen día, quiero hablar con un asesor de {{marca}}. Ref: {{twclid}} o={{o}} so={{so}}",
  "Hola, necesito ayuda para crear mi usuario en {{marca}}. Ref: {{twclid}} o={{o}} so={{so}}",
  "Buenas, llegué por la web de {{marca}}. Ref: {{twclid}} o={{o}} so={{so}}",
  "Hola, quiero más información de {{marca}}. Ref: {{twclid}} o={{o}} so={{so}}",
  "Buenas tardes, consulto por {{marca}}. Ref: {{twclid}} o={{o}} so={{so}}",
  "Hola, me interesa el acompañamiento de {{marca}}. Ref: {{twclid}} o={{o}} so={{so}}",
  "Buen día, quiero contactarme con {{marca}}. Ref: {{twclid}} o={{o}} so={{so}}",
] as const;

export const DEFAULT_WA_MESSAGES_BODY = DEFAULT_WA_MESSAGES.join("\n");
