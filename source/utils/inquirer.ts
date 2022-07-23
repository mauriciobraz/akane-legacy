import { randomUUID } from "crypto";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ChannelType,
  CommandInteraction,
  ComponentType,
  SelectMenuBuilder,
  SelectMenuOptionBuilder,
  type ButtonStyle,
  type CacheType,
  type Collection,
  type Interaction,
  type InteractionResponseFields,
  type Message,
  type MessageOptions,
} from "discord.js";

export namespace Inquirer {
  /** Context where the bot should ask the user for input. */
  export enum Context {
    Guild = "Guild",
    DM = "DM",
  }

  export interface BaseOptions<T> {
    // /** Question to ask the user. */
    // question: string;
    /** Options to pass to the message. */
    messageOptions: Omit<MessageOptions, "components">;

    /** Available choices for the user to select. */
    choices: T[];

    /** Context of the question. Defaults to `Context.Guild`. */
    context: Context;

    /** Timeout for the question. Defaults to `1000 * 30`. */
    timeout?: number;
  }

  export interface BaseValue {
    /** Unique identifier for this value. */
    id: string | number | boolean;
  }

  type RepliableInteraction<Cached extends CacheType = CacheType> = (
    | Interaction<Cached>
    | CommandInteraction<Cached>
  ) &
    InteractionResponseFields<Cached>;

  const IdSeparator = "&";

  export interface ButtonValue extends BaseValue {
    /** Label to display on the button. */
    label: string;

    /** What style to use for the button. */
    style: ButtonStyle;

    /** Emoji to display on the button. */
    emoji?: string;
  }

  export interface ButtonInquirerOptions extends BaseOptions<ButtonValue> {
    /** Should the button be disabled? */
    setButtonsDisabled?: boolean;

    /**
     * Message to edit the original message with when the user selects this button. When undefined,
     * the message will be deleted
     */
    postAnswerMessage?: string;
  }

  /**
   * Ask the user a question using buttons and return the user's response.
   * @param interaction The interaction to use for the inquirer.
   * @param options Configuration options for the inquirer.
   * @returns The id of the selected choice.
   */
  export async function askUsingButtons<
    T extends ButtonInquirerOptions,
    ReturnType = T["choices"][number]["id"]
  >(interaction: RepliableInteraction<CacheType>, options: T): Promise<ReturnType> {
    const uuid = randomUUID();

    const channel =
      options.context === Context.Guild
        ? interaction.channel
        : interaction.user.dmChannel || (await interaction.user.createDM());

    if (!channel) {
      throw new Error("Could not found a channel to prompt the user with.");
    }

    if (![ChannelType.DM, ChannelType.GuildText].includes(channel.type)) {
      throw new Error("Cannot send message to non-text channel.");
    }

    if (interaction.inGuild() && !interaction.deferred) {
      await interaction.deferReply({ ephemeral: true });
    }

    const buttonActionRow = new ActionRowBuilder<ButtonBuilder>();

    const buttons = options.choices.map(choice => {
      const button = new ButtonBuilder()
        .setLabel(choice.label)
        .setStyle(choice.style)
        .setCustomId(`${uuid}${IdSeparator}${choice.id}`);
      choice.emoji && button.setEmoji(choice.emoji);

      return button;
    });

    buttonActionRow.addComponents(buttons);

    const message =
      options.context === Context.Guild
        ? await interaction.editReply({ ...options.messageOptions, components: [buttonActionRow] })
        : await channel.send({ ...options.messageOptions, components: [buttonActionRow] });

    const answer = await channel.awaitMessageComponent({
      componentType: ComponentType.Button,
      filter: component =>
        component.customId.startsWith(`${uuid}${IdSeparator}`) &&
        component.user.id === interaction.user.id,
      time: options.timeout || 1000 * 30,
    });

    await answer.deferUpdate();

    if (options.postAnswerMessage) {
      let updatedButtons: ButtonBuilder[] = [];

      if (options.setButtonsDisabled) {
        updatedButtons = updatedButtons.map(button => {
          return ButtonBuilder.from(button).setDisabled(true);
        });
      }

      const updatedButtonsActionRow = new ActionRowBuilder<ButtonBuilder>();
      updatedButtonsActionRow.addComponents(updatedButtons);

      options.context === Context.Guild
        ? await interaction.editReply({
            components: [updatedButtonsActionRow],
            content: options.postAnswerMessage,
          })
        : await message.edit({
            components: [updatedButtonsActionRow],
            content: options.postAnswerMessage,
          });
    } else {
      if (options.context === Context.DM && message.deletable) {
        await message.delete();
      }
    }

    const [, choiceUniqueId] = answer.customId.split(IdSeparator);
    return getChoiceById(options.choices, choiceUniqueId)?.id as unknown as ReturnType;
  }

  export interface SelectValue extends BaseValue {
    /** Label to display on the button. */
    label: string;

    /** Description to display on the choice. */
    description?: string;

    /** Emoji to display on the choice. */
    emoji?: string;
  }

  export interface SelectInquirerOptions extends BaseOptions<SelectValue> {
    /** Select menu's placeholder text. */
    placeholder: string;

    /** Should the menu be disabled? */
    setDisabledWhenDone?: boolean;

    /**
     * Message to edit the original message with when the user selects this button. When undefined,
     * the message will be deleted
     */
    postAnswerMessage?: string;
  }

  /**
   * Ask the user a question using a select menu and return the user's response.
   * @param interaction The interaction to use for the inquirer.
   * @param options Configuration options for the inquirer.
   * @returns The id of the selected choice.
   */
  export async function askUsingSelectMenu<
    T extends SelectInquirerOptions,
    ReturnType = T["choices"][number]["id"]
  >(interaction: RepliableInteraction<CacheType>, options: T): Promise<ReturnType> {
    const uuid = randomUUID();

    const channel =
      options.context === Context.Guild
        ? interaction.channel
        : interaction.user.dmChannel || (await interaction.user.createDM());

    if (!channel) {
      throw new Error("Could not found a channel to prompt the user with.");
    }

    if (![ChannelType.DM, ChannelType.GuildText].includes(channel?.type)) {
      throw new Error("Cannot send message to non-text channel.");
    }

    if (interaction.inGuild() && !interaction.deferred) {
      await interaction.deferReply({ ephemeral: true });
    }

    const opts = options.choices.map(choice => {
      const optionBuilder = new SelectMenuOptionBuilder()
        .setLabel(choice.label)
        .setValue(choice.id.toString());

      choice.emoji && optionBuilder.setEmoji(choice.emoji);
      choice.description && optionBuilder.setDescription(choice.description);

      return optionBuilder;
    });

    const selectMenu = new SelectMenuBuilder()
      .setPlaceholder(options.placeholder)
      .setCustomId(uuid)
      .setOptions(opts);

    const selectMenuActionRow = new ActionRowBuilder<SelectMenuBuilder>().addComponents(selectMenu);

    const message = (
      options.context === Context.Guild
        ? await interaction.editReply({
            ...options.messageOptions,
            components: [selectMenuActionRow],
          })
        : await channel.send({
            ...options.messageOptions,
            components: [selectMenuActionRow],
          })
    ) as Message<boolean>;

    const answer = await channel.awaitMessageComponent({
      componentType: ComponentType.SelectMenu,
      filter: component => component.customId === uuid && component.user.id === interaction.user.id,
    });

    await answer.deferUpdate();

    let updatedSelectMenu: SelectMenuBuilder = selectMenu;

    if (options.setDisabledWhenDone) {
      updatedSelectMenu = SelectMenuBuilder.from(selectMenu).setDisabled(true);
    }

    const updatedActionRow = new ActionRowBuilder<SelectMenuBuilder>();
    updatedActionRow.addComponents(updatedSelectMenu);

    if (options.postAnswerMessage) {
      options.context === Context.Guild
        ? await interaction.editReply({
            components: [updatedActionRow],
            content: options.postAnswerMessage,
          })
        : await message.edit({
            components: [updatedActionRow],
            content: options.postAnswerMessage,
          });
    } else {
      if (options.context === Context.Guild) {
        if (options.setDisabledWhenDone) {
          selectMenu.setDisabled(true);

          await interaction.editReply({
            components: [updatedActionRow],
          });
        }
      } else {
        if (message.deletable) await message.delete();
      }
    }

    const choice = getChoiceById(options.choices, answer.values[0]);

    if (!choice) {
      throw new Error("No choice found for selected value.");
    }

    return choice.id as unknown as ReturnType;
  }

  export interface AskMessageInquirerOptions extends Omit<BaseOptions<unknown>, "choices"> {
    /** Maximum number of messages to retrieve. */
    maxMessages?: number;

    /** Timeout for the message. */
    timeout?: number;

    /** Delete the message used to ask the user a question. */
    deleteQuestion?: boolean;

    /** Delete the retrieved messages after receiving the answer. */
    deleteRetrievedMessages?: boolean;
  }

  export async function askMessages<T extends AskMessageInquirerOptions>(
    interaction: RepliableInteraction<CacheType>,
    options: T
  ): Promise<Collection<string, Message>> {
    const channel =
      options.context === Context.Guild
        ? interaction.channel
        : interaction.user.dmChannel || (await interaction.user.createDM());

    if (!channel) {
      throw new Error("Could not found a channel to prompt the user with.");
    }

    if (![ChannelType.DM, ChannelType.GuildText].includes(channel?.type)) {
      throw new Error("Cannot send message to non-text channel.");
    }

    if (interaction.inGuild() && !interaction.deferred) {
      await interaction.deferReply({ ephemeral: true });
    }

    const message = (
      options.context === Context.Guild
        ? await interaction.editReply(options.messageOptions)
        : await channel.send(options.messageOptions)
    ) as Message<boolean>;

    const messages = await channel.awaitMessages({
      max: options.maxMessages,
      time: options.timeout,
      errors: ["time"],
      filter: message => message.author.id === interaction.user.id,
    });

    const messagesClone = messages.clone();

    if (options.deleteRetrievedMessages) {
      for await (const [, message] of messages) {
        if (message.deletable) await message.delete();
      }
    }

    if (options.deleteQuestion && options.context === Context.DM) {
      if (message.deletable) {
        await message.delete();
      }
    }

    return messagesClone;
  }

  /**
   * Utility function to get the id of a choice from a unique id.
   * @param choices Array of choices to choose from.
   * @param choice Unique ID of the choice to find.
   * @returns The unique ID of the found choice.
   * @internal
   */
  function getChoiceById<T extends BaseValue>(choices: T[], choice: any): T | undefined {
    return choices.find(c => {
      if (typeof c.id === "string") {
        return c.id === choice;
      } else if (typeof c.id === "number") {
        return c.id === parseInt(choice, 10);
      } else if (typeof c.id === "boolean") {
        return c.id === Boolean(c);
      }
    });
  }
}

export const Context = Inquirer.Context;
