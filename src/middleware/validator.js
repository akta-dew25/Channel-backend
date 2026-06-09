import { perfectPayloadV1 } from "perfect-payload";

export const validatePayload = ({ rule }) => {
  return (req, res, next) => {
    try {
      const { statusCode, ...response } = perfectPayloadV1(req?.body, rule);
      if (+statusCode >= 200 && +statusCode <= 299) {
        req.validatedBody = response?.validatedPayload;
        next();
      } else res.status(statusCode).json(response);
    } catch (error) {
      console.error("Error validating payload", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
};
