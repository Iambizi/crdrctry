/** @type {import('next').NextConfig} */
const nextConfig = {
  sassOptions: {
    includePaths: ['./src/styles'],
    prependData: `@import "abstracts/_variables.scss"; @import "abstracts/_mixins.scss";`
  }
}

export default nextConfig;
