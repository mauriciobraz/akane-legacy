import type { BaseTranslation } from "../../i18n-types";

const pt_BR_slashes: BaseTranslation = {
  // Related slash commands are listed here. Eg. name, description, options, etc.
  WARN: {
    NAME: "avisar",
    DESCRIPTION: "Avisa um usuário e salva o aviso permanentemente.",
    OPTIONS: {
      USER: {
        NAME: "usuário",
        DESCRIPTION: "O usuário a ser avisado.",
      },
      REASON: {
        NAME: "motivo",
        DESCRIPTION: "Motivo que será salvo e enviado ao usuário.",
      },
      SILENT: {
        NAME: "silencioso",
        DESCRIPTION: "Não tenta avisar o usuário em DM.",
      },
    },
  },
  INFRACTIONS: {
    NAME: "infrações",
    DESCRIPTION: "Lista as infrações do usuário.",
    OPTIONS: {
      USER: {
        NAME: "usuário",
        DESCRIPTION: "O usuário que deseja ver as infrações.",
      },
    },
  },
};

export default pt_BR_slashes;
