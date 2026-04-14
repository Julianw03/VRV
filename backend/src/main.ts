import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { WsAdapter } from '@nestjs/platform-ws';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as process from 'node:process';
import 'reflect-metadata';

//TODO:
// 1. Simple REST Api for Match-Info
// 2. Set up CORS
// 3. ? Think about how other consumer plugins can be implemented
async function bootstrap() {
    const isDev = process.env.NODE_ENV === 'development';

    const port = process.env.port || 3000;

    const logLevel = isDev ? ['log', 'error', 'warn', 'debug'] : ['log', 'error', 'warn'];
    const corsOrigin = isDev ? '*' : [`http://127.0.0.1:${port}`, `http://localhost:${port}`];

    console.log("Using log level:", logLevel);
    console.log("Using CORS origin:", corsOrigin);

    const app = await NestFactory.create(AppModule, {
        logger: logLevel as any,
    });
    app.enableVersioning({
        type: VersioningType.URI,
        defaultVersion: '1',
        prefix: 'api/v',
    });
    app.enableShutdownHooks();
    app.useWebSocketAdapter(new WsAdapter(app));
    app.useGlobalPipes(
        new ValidationPipe({ transform: true, whitelist: true }),
    );
    app.enableCors({ origin: corsOrigin });

    const config = new DocumentBuilder()
        .setTitle('Valorant Replay Viewer')
        .setDescription('')
        .setVersion('1.0')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
    await app.listen(port);
}

bootstrap();
