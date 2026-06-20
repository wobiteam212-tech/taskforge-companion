# #region step-25.4
# Dockerfile רב-שלבי ל-client. שלב build בונה את ה-Angular ל-static files; שלב
# runtime הוא nginx שמגיש אותם. ה-image הסופי לא נושא Node, pnpm או node_modules
# — רק HTML/JS/CSS ו-nginx. עשרות MB במקום מאות.

# ── שלב build: ng build ──
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate
COPY package.json ./
RUN pnpm install
COPY . .
RUN pnpm exec ng build

# ── שלב runtime: nginx מגיש את ה-static + מתפקד כ-reverse proxy ──
FROM nginx:alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
# פלט ה-application builder יושב תחת dist/<project>/browser
COPY --from=build /app/dist/taskforge-client/browser /usr/share/nginx/html
EXPOSE 80
# #endregion
