export class LogLevel{
  
    private static HTTP: string = "http";   //10 is the alias for 'HTTP' value as number.
    private static DEBUG: string = "debug"; //20 is the alias for 'DEBUG' value as number.
    private static INFO: string = "info";   //30 is the alias for 'INFO' value as number.
    private static WARN: string = "warn";   //40 is the alias for 'WARN' value as number.
    private static ERROR: string = "error"; //50 is the alias for 'ERROR' value as number.
    private static FATAL: string = "fatal"; //60 is the alias for 'FATAL' value as number.

    public static fetchLevel(): string {
        const configuredLevel: string = process.env.APP_ROOT_LOG_LEVEL || this.INFO;
        
        let level: string;

        if(configuredLevel.toLowerCase() === LogLevel.HTTP){
            level = LogLevel.HTTP;
        } else if(configuredLevel.toLowerCase() === LogLevel.DEBUG) {
            level = LogLevel.DEBUG;
        } else if(configuredLevel.toLowerCase() === LogLevel.INFO) {
            level = LogLevel.INFO;
        } else if(configuredLevel.toLowerCase() === LogLevel.WARN) {
            level = LogLevel.WARN;
        } else if(configuredLevel.toLowerCase() === LogLevel.ERROR) {
            level = LogLevel.ERROR;
        }  else if(configuredLevel.toLowerCase() === LogLevel.FATAL) {
            level = LogLevel.FATAL;
        } else {
            level = LogLevel.INFO;
        }
        return level;
    }
}