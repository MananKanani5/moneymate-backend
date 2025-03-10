import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import prisma from './prisma';

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET as string,
};

export const passportConfig = (passport: any): void => {
    passport.use(
        new JwtStrategy(opts, async (jwtPayload: { id: string }, done) => {
            try {
                const user = await prisma.user.findFirst({
                    where: { id: jwtPayload.id },
                });

                if (!user) {
                    return done(null, false, { message: 'User not found' });
                }

                return done(null, {
                    id: user.id
                });

            } catch (err) {
                console.error('Error in passport-jwt strategy:', err);
                return done(err, false);
            }
        })
    );
};
