import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import clientPromise from "@/lib/db"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
          response_type: "code",
        }
      }
    }),
  ],
  adapter: MongoDBAdapter(clientPromise),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      return session
    },
    async signIn({ profile }) {
      if (!profile?.email) {
        return false
      }
      return true
    },
    async redirect({ url, baseUrl }) {
      // Handle sign-in redirects
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`
      }
      // Handle sign-out redirects
      else if (url.includes("/signout") || url.includes("/logout")) {
        return `${baseUrl}/`
      }
      // Handle other redirects within the same origin
      else if (new URL(url).origin === baseUrl) {
        return url
      }
      // Default redirect to dashboard
      return `${baseUrl}/dashboard`
    }
  },
  pages: {
    signIn: '/',
    signOut: '/',
    error: '/',
  },
  events: {
    async signOut({ token }) {
      // You can add custom logic here if needed when a user signs out
      console.log("User signed out")
    }
  },
  debug: process.env.NODE_ENV === "development",
})

export { handler as GET, handler as POST } 