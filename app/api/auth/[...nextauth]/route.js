import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getCsrfToken } from 'next-auth/react';
import { ExtendedSiweMessage } from '@/utils/ExtendedSiweMessage';
import { connectToDB } from '@/utils/database';
import User from '@/models/user';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'EVM',
      credentials: {
        message: {
          label: 'Message',
          placeholder: '0x0',
          type: 'text',
        },
        signature: {
          label: 'Signature',
          placeholder: '0x0',
          type: 'text',
        },
      },
      async authorize(credentials, req) {
        try {
          const siwe = new ExtendedSiweMessage(
            JSON.parse(credentials?.message || '{}')
          );

          const nextAuthUrl = process.env.NEXTAUTH_URL;
          if (!nextAuthUrl) {
            return null;
          }

          const nextAuthHost = new URL(nextAuthUrl).host;
          if (siwe.domain !== nextAuthHost) {
            return null;
          }

          if (
            siwe.nonce !==
            (await getCsrfToken({ req: { headers: req.headers } }))
          ) {
            return null;
          }

          await siwe.verify({ signature: credentials?.signature || '' });
          return {
            id: siwe.address,
            username: siwe.username,
            name: siwe.name,
            pfp: siwe.pfp,
            isVerified: siwe.isVerified
          };
        } catch (e) {
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async session({ session, token }) {
      const sessionUser = await User.findOne({ address: token.sub });

      if (session.user && sessionUser) {
        session.user.address = sessionUser.address;
        session.user.id = sessionUser._id;
        session.user.username = sessionUser.username;
        if (sessionUser.name) session.user.name = sessionUser.name;
        if (sessionUser.profilePicture)
          session.user.image = sessionUser.profilePicture;
      }

      return session;
    },
    async signIn({ user }) {
      try {
        await connectToDB();

        const address = user.id;
        const username = user.username;
        const name = user.name;
        const profilePicture = user.pfp;
        const isVerified = user.isVerified;

        console.log("address: ", address);
        console.log("username: ", username);
        console.log("name: ", name);
        console.log("profilePicture: ", profilePicture);
        console.log("isVerified: ", isVerified);

        const userExists = await User.findOne({ address });

        if (!userExists) {
          if (!username) {
            throw new Error('No username provided for a new user.');
          }
          await User.create({
            address,
            username,
            name,
            profilePicture,
            timestamp: new Date(),
            isVerified
          });
        }
        return true;
      } catch (error) {
        console.log(error);
        return false;
      }
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
