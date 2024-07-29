import { DynamicModule } from "@nestjs/common";
// import { DocumentBuilder, OpenAPIObject, SwaggerModule } from "@nestjs/swagger";
// import { SoUtil } from "../utils/so.util";
import { LoggerModule } from "nestjs-pino";
import { Bindings } from "pino";
import { LogLevel } from "../utills/log.level";
import * as fs from 'fs';
import * as path from 'path';
import * as pinoMultiStream from 'pino-multi-stream';

export class SoModuleService {

    public static initLogger(): DynamicModule {
        let logFile = true;
        if (process.env.LOGS == "1") {
            logFile = false;
        }
        const logFilePath = 'logs/app.log';

        // Ensure the log directory exists
        if (logFile) {
            const logDir = path.dirname(logFilePath);
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }
        }

        let logStream;
        if (logFile) {
            logStream = fs.createWriteStream(logFilePath, { flags: 'a' });
        }

        const streams = [
            { stream: process.stdout } // Console stream
        ];

        if (logFile && logStream) {
            streams.push({ stream: logStream });
        }

        // Create a multi-stream
        const multiStream = pinoMultiStream.multistream(streams);

        return LoggerModule.forRoot({
            pinoHttp: {
                serializers: {
                    req: (req) => undefined,
                    res: (res) => undefined
                },
                level: LogLevel.fetchLevel(),
                formatters: {
                    level: (label: string, number: number) => {
                        return { level: label };
                    },
                    bindings: (bindings: Bindings) => {
                        return {};
                    },
                    log: (object: Record<string, unknown>) => {
                        if (object.context)
                            return { context: object.context };
                        else
                            return undefined;
                    }
                },
                timestamp: () => `, "timestamp":"${new Date(Date.now()).toISOString()}"`,
                stream: multiStream,
            },
        });
    }
}
