import type { BaseTranslation } from "../../i18n-types";

const pt_BR_errors: BaseTranslation = {
  BOT_ROLE_INFERIOR_THAN_TARGET: "Este usuário possui um cargo com hierarquia superior a minha.",
  BOT_MISSING_PERMISSIONS: "Este comando que eu tenha a{{s}} seguinte{{s}} {{permissão|permissões}}: {permissions:string[]|join}.",
  USER_MISSING_PERMISSIONS: "Você não possui a{{s}} seguinte{{s}} {{permissão|permissões}}: {permissions:string[]|join}.",
  NO_REASON_PROVIDED: "Nenhum motivo foi fornecido.",
  NOT_IN_GUILD: "Este comando só pode ser usado em servidores.",
  TARGET_ROLE_HIGHER: "Este usuário possui um cargo superior ao seu.",
  UNKNOWN_ERROR: "Ocorreu um erro desconhecido, reporte isso ao desenvolvedor ou tente novamente mais tarde.",
  USER_TRYING_TO_PUNISH_HIMSELF: "Ei... você não pode punir você mesmo.",
};

export default pt_BR_errors;
