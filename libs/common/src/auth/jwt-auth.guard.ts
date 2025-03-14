import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { AUTH_SERVICE } from "./services";
import { ClientProxy } from "@nestjs/microservices";
import { Observable } from "rxjs";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(@Inject(AUTH_SERVICE) private authClient: ClientProxy) {}

  private getAuthentication(context: ExecutionContext) {
    let authentication: string;
    if(context.getType() === 'rpc') {
      authentication =  context.switchToRpc().getData().Authentication;
    }
    else if(context.getType() === 'http') {
      authentication = context.switchToHttp().getRequest().cookies?.Authentication;
    }

    if(!authentication) {
      throw new UnauthorizedException('No Authentication value provided');
    }
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const authentication = this.getAuthentication(context);
  }
}