import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'kelaode520',
      database: 'xiaoyali',
      autoLoadEntities: true,
      synchronize: true,
    }),
    UserModule,
    AuthModule,
  ],
})
export class AppModule {}
