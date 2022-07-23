import type { BaseTranslation } from "../../i18n-types";

const pt_BR_slashes: BaseTranslation = {
  BAN: {
    DESCRIPTION: "Bane um usuário permanentemente do servidor.",
    NAME: "banir",
    OPTIONS: {
      PROOFS: {
        DESCRIPTION: "Links para provas que demonstram o motivo do banimento. Separe com vírgula.",
        NAME: "provas",
      },
      REASON: {
        DESCRIPTION: "Motivo pelo qual este usuário está sendo banido.",
        NAME: "motivo",
      },
      SILENT: {
        DESCRIPTION: "Não tenta avisar o usuário via DM sobre o banimento.",
        NAME: "silencioso",
      },
      TIME: {
        DESCRIPTION: "Tempo de banimento do usuário (em dias).",
        NAME: "tempo",
      },
      USER: {
        DESCRIPTION: "O usuário que será banido do servidor.",
        NAME: "usuário",
      },
    },
  },
  INFRACTIONS: {
    DESCRIPTION: "Lista todas as infrações de um usuário em específico.",
    NAME: "infrações",
    OPTIONS: {
      USER: {
        DESCRIPTION: "O usuário que deseja ver as infrações.",
        NAME: "usuário",
      },
    },
  },
  KICK: {
    DESCRIPTION: "Expulsa um usuário deste servidor e salva como infração (use /infrações para ver o histórico).",
    NAME: "expulsar",
    OPTIONS: {
      PROOFS: {
        DESCRIPTION: "Links para provas que demonstram o motivo da expulsão. Separe com vírgula.",
        NAME: "provas",
      },
      REASON: {
        DESCRIPTION: "Motivo pelo qual este usuário está sendo expulso.",
        NAME: "motivo",
      },
      SILENT: {
        DESCRIPTION: "Não tenta avisar o usuário via DM sobre a expulsão.",
        NAME: "silencioso",
      },
      USER: {
        DESCRIPTION: "O usuário que será expulso do servidor.",
        NAME: "usuário",
      },
    },
  },
  MUTE: {
    DESCRIPTION: "Silencia um usuário deste servidor por um tempo específico.",
    NAME: "silenciar",
    OPTIONS: {
      PROOFS: {
        DESCRIPTION: "Links para provas que demonstram o motivo do silenciamento. Separe com vírgula.",
        NAME: "provas",
      },
      REASON: {
        DESCRIPTION: "Motivo pelo qual este usuário está sendo silenciado.",
        NAME: "motivo",
      },
      TIME: {
        DESCRIPTION: "Tempo de silenciamento do usuário (em minutos) (0 = indefinido).",
        NAME: "tempo",
      },
      USER: {
        DESCRIPTION: "Usuário que será silenciado.",
        NAME: "usuário",
      },
    },
  },
  UNMUTE: {
    DESCRIPTION: "Dessilencia um usuário deste servidor.",
    NAME: "dessilenciar",
    OPTIONS: {
      REASON: {
        DESCRIPTION: "Motivo pelo qual este usuário está sendo dessilenciado.",
        NAME: "motivo",
      },
      USER: {
        DESCRIPTION: "Usuário que será dessilenciado.",
        NAME: "usuário",
      },
    },
  },
  WARN: {
    DESCRIPTION: "Avisa um usuário deste servidor e salva como infração (use /infrações para ver o histórico).",
    NAME: "avisar",
    OPTIONS: {
      PROOFS: {
        DESCRIPTION: "Links para provas que demonstram o motivo do aviso. Separe com vírgula.",
        NAME: "provas",
      },
      REASON: {
        DESCRIPTION: "Motivo pelo qual este usuário está sendo avisado.",
        NAME: "motivo",
      },
      SILENT: {
        DESCRIPTION: "Não tenta avisar o usuário via MD sobre o aviso.",
        NAME: "silencioso",
      },
      USER: {
        DESCRIPTION: "Usuário que será avisado.",
        NAME: "usuário",
      },
    },
  },

  TICKETS: {
    GROUP_DESCRIPTION: "Comandos relacionados a tickets do servidor.",
    GROUP_NAME: "tickets",

    SETUP: {
      DESCRIPTION: "Configura um sistema de tickets para este servidor.",
      NAME: "configurar",
      OPTIONS: {
        CHANNEL: {
          DESCRIPTION: "Canal que será utilizado para iniciar um ticket.",
          NAME: "canal",
        },
        TICKET_TYPE: {
          DESCRIPTION: "Tipo de ticket que será utilizado.",
          NAME: "tipo",
        },
      },
    },
  },
};

export default pt_BR_slashes;
