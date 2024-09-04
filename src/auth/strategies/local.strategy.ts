import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import { AuthService } from "../auth.service";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {

    constructor(private authService: AuthService) {
        super({
            usernameField: 'email', // local strategy expects username, and password feild, so if your schema doesnot have username property you have to map it with the similar feild in your schema. for example email in this case. 
        });
    }
    async validate(email: string, password: string) {
        return this.authService.validateUser(email, password)
    }
}

