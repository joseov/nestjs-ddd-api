import { Injectable, Logger } from '@nestjs/common';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  private readonly logger = new Logger(TypeOrmConfigService.name);

  constructor(private configService: ConfigService) {}

  async createTypeOrmOptions(): Promise<TypeOrmModuleOptions> {
    const connectionStrategy = this.configService.get<string>(
      'DB_CONNECTION_STRATEGY',
      'env',
    );

    let dbConfig: Partial<TypeOrmModuleOptions> = {};

    if (connectionStrategy === 'aws-secrets') {
      dbConfig = await this.getAwsSecretConfig();
    } else {
      dbConfig = this.getEnvConfig();
    }

    const sslConfig = this.getSslConfig();

    return {
      type: 'postgres',
      synchronize: this.configService.get<boolean>('DB_SYNCHRONIZE', false), // Never use synchronize in production
      autoLoadEntities: true,
      ...dbConfig,
      ...sslConfig,
    } as TypeOrmModuleOptions;
  }

  private getEnvConfig(): Partial<TypeOrmModuleOptions> {
    this.logger.log('Using ENV connection strategy for database');
    return {
      host: this.configService.get<string>('DB_HOST'),
      port: this.configService.get<number>('DB_PORT'),
      username: this.configService.get<string>('DB_USERNAME'),
      password: this.configService.get<string>('DB_PASSWORD'),
      database: this.configService.get<string>('DB_DATABASE'),
    };
  }

  private async getAwsSecretConfig(): Promise<Partial<TypeOrmModuleOptions>> {
    this.logger.log(
      'Using AWS Secrets Manager connection strategy for database',
    );
    const secretArn = this.configService.get<string>('DB_SECRET_ARN');

    if (!secretArn) {
      throw new Error(
        'DB_SECRET_ARN is missing but connection strategy is aws-secrets',
      );
    }

    const region = this.configService.get<string>('AWS_REGION', 'us-east-1');
    const client = new SecretsManagerClient({ region });
    let secretString: string | undefined;

    try {
      const response = await client.send(
        new GetSecretValueCommand({
          SecretId: secretArn,
        }),
      );
      secretString = response.SecretString;
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Failed to fetch database secret from AWS: ${err.message}`,
      );
      throw error;
    }

    if (!secretString) {
      throw new Error('SecretString is empty in the retrieved AWS secret');
    }

    interface AwsDbSecret {
      host?: string;
      endpoint?: string;
      port?: string | number;
      username?: string;
      password?: string;
      dbname?: string;
      database?: string;
    }

    const secretObj = JSON.parse(secretString) as AwsDbSecret;

    return {
      host: secretObj.host || secretObj.endpoint,
      port: secretObj.port ? parseInt(String(secretObj.port), 10) : undefined,
      username: secretObj.username,
      password: secretObj.password,
      database: secretObj.dbname || secretObj.database,
    };
  }

  private getSslConfig() {
    const useSsl = this.configService.get<string>('DB_USE_SSL') === 'true';
    if (!useSsl) {
      return {};
    }

    const cert = this.configService.get<string>('DB_SSL_CERT');
    if (cert) {
      return {
        ssl: {
          ca: cert,
          rejectUnauthorized: true,
        },
      };
    }

    // Default SSL if requested but no explicit cert
    return {
      ssl: {
        rejectUnauthorized: false,
      },
    };
  }
}
