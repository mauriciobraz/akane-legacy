import type { BaseTranslation } from "../../i18n-types";

const pt_BR_slashes: BaseTranslation = {
  INFRACTIONS: {
    NAME: "infrações",
    DESCRIPTION: "Lista todas as infrações de um usuário em específico.",
    OPTIONS: {
      USER: {
        NAME: "usuário",
        DESCRIPTION: "O usuário que deseja ver as infrações.",
      },
    },
  },

  BAN: {
    NAME: "banir",
    DESCRIPTION: "Bane um usuário permanentemente do servidor.",
    OPTIONS: {
      USER: {
        NAME: "usuário",
        DESCRIPTION: "O usuário que será banido do servidor.",
      },
      REASON: {
        NAME: "motivo",
        DESCRIPTION: "Motivo pelo qual este usuário está sendo banido.",
      },
      SILENT: {
        NAME: "silencioso",
        DESCRIPTION: "Não tenta avisar o usuário via DM sobre o banimento.",
      },
      TIME: {
        NAME: "tempo",
        DESCRIPTION: "Tempo de banimento do usuário (em dias).",
      },
    },
  },

  KICK: {
    NAME: "expulsar",
    DESCRIPTION: "Expulsa um usuário deste servidor e salva como infração (use /infrações para ver o histórico).",
    OPTIONS: {
      USER: {
        NAME: "usuário",
        DESCRIPTION: "O usuário que será expulso do servidor.",
      },
      REASON: {
        NAME: "motivo",
        DESCRIPTION: "Motivo pelo qual este usuário está sendo expulso.",
      },
      SILENT: {
        NAME: "silencioso",
        DESCRIPTION: "Não tenta avisar o usuário via DM sobre a expulsão.",
      },
    },
  },

  WARN: {
    NAME: "avisar",
    DESCRIPTION: "Avisa um usuário deste servidor e salva como infração (use /infrações para ver o histórico).",
    OPTIONS: {
      USER: {
        NAME: "usuário",
        DESCRIPTION: "Usuário que será avisado.",
      },
      REASON: {
        NAME: "motivo",
        DESCRIPTION: "Motivo pelo qual este usuário está sendo avisado.",
      },
      SILENT: {
        NAME: "silencioso",
        DESCRIPTION: "Não tenta avisar o usuário via MD sobre o aviso.",
      },
    },
  },
};

export default pt_BR_slashes;
