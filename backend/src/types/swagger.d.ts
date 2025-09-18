declare module 'swagger-jsdoc' {
  interface SwaggerDefinition {
    openapi: string;
    info: {
      title: string;
      version: string;
      description: string;
      contact?: {
        name: string;
        email: string;
      };
    };
    servers?: Array<{
      url: string;
      description: string;
    }>;
    components?: {
      securitySchemes?: Record<string, any>;
    };
  }

  interface SwaggerOptions {
    definition: SwaggerDefinition;
    apis: string[];
  }

  function swaggerJsdoc(options: SwaggerOptions): any;
  export = swaggerJsdoc;
}

declare module 'swagger-ui-express' {
  import { Request, Response, NextFunction } from 'express';

  interface SwaggerUiOptions {
    customCss?: string;
    customSiteTitle?: string;
  }

  function serve(): (req: Request, res: Response, next: NextFunction) => void;
  function setup(specs: any, options?: SwaggerUiOptions): (req: Request, res: Response, next: NextFunction) => void;

  export { serve, setup };
}