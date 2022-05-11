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
        return String(data).indexOf('beian.miit.gov.cn') >= 0
          ? data
          : {
              statusCode: HttpStatus.OK,
              message: 'success',
              data,
            };
      }),
    );
  }
}
