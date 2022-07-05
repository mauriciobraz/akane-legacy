import type { BaseTranslation } from "../../i18n-types";

const pt_BR_errors: BaseTranslation = {
  MISSING_PERMISSIONS:
    "Esta ação necessita da{{s}} seguinte{{s}} {{permissão|permissões}}: {permissions:string[]|join}.",
  NOT_IN_GUILD: "Este comando só pode ser usado em servidores.",
  UNKNOWN_ERROR:
    "Ocorreu um erro desconhecido, reporte isso ao desenvolvedor ou tente novamente mais tarde.",
};

export default pt_BR_errors;
