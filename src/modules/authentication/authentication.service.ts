import { JwtService } from '@nestjs/jwt';
import { BadRequestException, Injectable } from '@nestjs/common';
import { GoogleSigninRequest, LoginRequest } from './dto/requests/signin.dto';
import { Inject } from '@nestjs/common/decorators';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { RegisterRequest } from './dto/requests/register.dto';
import { SendOtpRequest } from './dto/requests/send-otp.dto';
import { VerifyOtpRequest } from './dto/requests/verify-otp.dto';
import { RegisterUserTransaction } from './transactions/register-user.transaction';
import { SendOtpTransaction } from './transactions/send-otp.transaction';
import { UserService } from '../user/user.service';
import { VerifyOtpTransaction } from './transactions/verify-otp.transaction';
import { jwtSignOptions } from 'src/core/setups/jwt.setup';
import axios from 'axios';
import { Role } from 'src/infrastructure/data/enums/role.enum';

import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { Wallet } from 'src/infrastructure/entities/wallet/wallet.entity';
import { FirebaseAdminService } from '../notification/firebase-admin-service';
import { User } from 'src/infrastructure/entities/user/user.entity';

@Injectable()
export class AuthenticationService {
  constructor(
    @Inject(UserService) private readonly userService: UserService,
    

    @Inject(RegisterUserTransaction)
    private readonly registerUserTransaction: RegisterUserTransaction,
    @Inject(SendOtpTransaction)
    private readonly sendOtpTransaction: SendOtpTransaction,
    @Inject(VerifyOtpTransaction)
    private readonly verifyOtpTransaction: VerifyOtpTransaction,
    @Inject(JwtService) private readonly jwtService: JwtService,

    @InjectRepository(Wallet) private readonly walletRepo: Repository<Wallet>,
    private readonly _firebase_admin_service: FirebaseAdminService,

    @Inject(ConfigService) private readonly _config: ConfigService,
  ) {}

  async validateUser(req: LoginRequest): Promise<any> {
    const user = await this.userService.findOne([
      { email: req.username },
      { username: req.username },
      { phone: req.username },
    ] as any);
    let isMatch = false;
    if (user) {
      isMatch = await bcrypt.compare(
        req.password + this._config.get('app.key'),
        user.password,
      );
    }
    if (user && isMatch) {
      return user;
    }
    return null;
  }

  async login(user: any) {
    if (!user) throw new BadRequestException('message.invalid_credentials');
    const payload = { username: user.username, sub: user.id };
    return {
      ...user,
      access_token: this.jwtService.sign(payload, jwtSignOptions(this._config)),
    };
  }
  async googleSignin(req: GoogleSigninRequest) {
  return  axios
      .get(
        `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${req.token}`,
      )
      .then(async (response) => {
        const userInfo = response.data;
     

        const user = await this.userService._repo.findOneBy({
        id: userInfo.id,
        })

        if (!user) {
          const newUser = new User({...userInfo,role: req.role,username: userInfo.email,avatar:userInfo.picture});
          return await {...this.userService._repo.save(newUser),access_token: this.jwtService.sign({ username: userInfo.email, sub: userInfo.id }, jwtSignOptions(this._config))};
        }
        else
        return {...user,access_token: this.jwtService.sign({ username: userInfo.email, sub: userInfo.id }, jwtSignOptions(this._config))};
      })
     
      .catch((error) => {
        return error.response.data;
      });
  }



async  getAppleUserFromToken(idToken) {
  try {
    // 1. Fetch Apple's public keys
    const { data: appleKeys } = await axios.get('https://appleid.apple.com/auth/keys');
    
    // 2. Decode the token header to identify which key was used
    const decodedHeader = this.jwtService.decode(idToken, { complete: true }).header;
    
    // 3. Find the matching key
    const key = appleKeys.keys.find(k => k.kid === decodedHeader.kid);
    if (!key) {
      throw new Error('Apple public key not found for the given token.');
    }

    // 4. Convert the Apple key to a PEM format
    const applePublicKey = `-----BEGIN PUBLIC KEY-----\n${key.x5c[0]}\n-----END PUBLIC KEY-----`;

    // 5. Verify the token using the matching key
    const decodedToken = this.jwtService.verify(idToken, {
      algorithms: ['ES256'],
      audience: 'https://appleid.apple.com',
      issuer: 'https://appleid.apple.com',
      publicKey: applePublicKey,
    });

    // 6. Return user information
    return {
      userId: decodedToken.sub,
      email: decodedToken.email,
    };
  } catch (error) {
    console.error('Error decoding Apple ID token:', error);
    throw error;
  }
}



  

  async register(req: any) {
    const user = await this.registerUserTransaction.run(req);

    return user;
  }

  async sendOtp(req: SendOtpRequest) {
    return await this.sendOtpTransaction.run(req);
  }

  async verifyOtp(req: VerifyOtpRequest) {
    return await this.verifyOtpTransaction.run(req);
  }
}
