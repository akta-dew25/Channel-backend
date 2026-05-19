export const chatGroupPayloadValidator = {
  name: {
    dependency: {
      groupType: {
        setDependencyRule: (name, groupType) => {
          if (groupType === "channel") {
            return {
              mandatory: true,

              allowNull: false,

              type: "string",

              minLength: 2,

              maxLength: 50,

              mandatoryError: "Channel name is required",
            };
          }

          return {
            mandatory: false,

            allowNull: true,

            type: "string",

            minLength: 2,

            maxLength: 50,
          };
        },
      },
    },
  },

  /**
   * DESCRIPTION
   */

  description: {
    mandatory: false,

    allowNull: true,

    type: "string",

    maxLength: 300,
  },

  /**
   * AVATAR
   */

  avatar: {
    mandatory: false,

    allowNull: true,

    type: "url",
  },

  /**
   * GROUP TYPE
   */

  groupType: {
    mandatory: true,

    allowNull: false,

    type: "enum",

    enumValues: ["channel", "group", "personal"],

    mandatoryError: "groupType is required",

    typeError: "groupType must be channel, group or personal",
  },

  /**
   * PRIVACY TYPE
   */

  privacyType: {
    mandatory: false,

    allowNull: true,

    type: "enum",

    enumValues: ["public", "private"],
  },

  /**
   * MEMBERS
   */

  membersIds: {
    mandatory: true,

    allowNull: false,

    type: "array",

    allowEmptyArray: false,

    mandatoryError: "memberIds is required",

    emptyArrayError: "At least one member is required",

    elementConstraints: {
      type: "string",

      allowNull: false,
    },
  },
};
