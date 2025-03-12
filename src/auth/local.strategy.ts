import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService
  ) {
    super({ usernameField: 'userName' }); // Specify the field to use for username
  }

  async validate(username: string, password: string): Promise<any> {
    console.log("validate called")
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      console.log("Failed login attempt.")
      throw new UnauthorizedException();
    }
    console.log("user is validated")
    console.log("Userdata" + user)
    return user;
  }
}
