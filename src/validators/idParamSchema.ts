import Joi from "joi";

const idParamSchema = Joi.object({
    id: Joi.number().required(),
});

export const validateidParamSchema = (idParam: any) => idParamSchema.validate(idParam);