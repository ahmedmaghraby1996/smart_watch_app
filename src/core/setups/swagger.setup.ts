import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';


import { AuthenticationModule } from 'src/modules/authentication/authentication.module';


import { TransactionModule } from 'src/modules/transaction/transaction.module';
import { UserModule } from 'src/modules/user/user.module';
import { WatchModule } from 'src/modules/watch/watch.module';

export default (app: INestApplication, config: ConfigService) => {
  const operationIdFactory = (controllerKey: string, methodKey: string) =>
    methodKey;

  const publicConfig = new DocumentBuilder()
    .addBearerAuth()
    .setTitle(`${config.get('APP_NAME')} API`)
    .setDescription(`${config.get('APP_NAME')} API description`)
    .setVersion('v1')
    .setContact(
      'Contact',
      'https://github.com/mahkassem',
      'mahmoud.ali.kassem@gmail.com',
    )
    .setLicense(
      'Developed by Ahmed el-Maghraby',
      'https://github.com/mahkassem',
    )
    .addServer(config.get('APP_HOST'))  
    .build();

  const publicDocument = SwaggerModule.createDocument(app, publicConfig, {
    include: [
      WatchModule,
      AuthenticationModule,
      UserModule,
      // TransactionModule,
    ],
    operationIdFactory,
  });

  SwaggerModule.setup('swagger', app, publicDocument);
};
