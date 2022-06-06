import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class RESTfulResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        if (
          ['home', 'officialNotify', 'officialNotifyGet'].includes(
            context.getHandler().name,
          )
        ) {
          return data;
        } else {
          return {
            statusCode: HttpStatus.OK,
            message: 'success',
            data,
          };
        }
      }),
    );
  }
}
