# Zeetcode CI/CD

## CI/CD la gi?

CI la buoc GitHub tu dong kiem tra code sau moi lan push hoac pull request. Trong du an nay, CI se:

- build frontend;
- typecheck 5 backend services;
- chay test cua UserService.

CD la buoc tu dong deploy sau khi CI da xanh. Du an nay co Docker judge va nhieu service, nen CD duoc dat sau mot cong tac an toan: no chi chay khi repository variable `ENABLE_DEPLOY` bang `true`.

## Flow hien tai

### Push vao `dev`

GitHub Actions chay CI. Muc tieu cua `dev` la bat loi som truoc khi merge.

### Push hoac merge vao `main`

GitHub Actions chay CI. Neu CI thanh cong va `ENABLE_DEPLOY=true`, workflow Deploy se SSH vao server, pull code moi nhat tu `main`, sau do chay `.github/scripts/deploy-production.sh`.

### Pull request vao `dev` hoac `main`

GitHub Actions chay CI de chan code loi truoc khi merge.

## Can cau hinh gi tren GitHub?

Vao repository GitHub, mo `Settings -> Secrets and variables -> Actions`.

Them repository variable:

- `ENABLE_DEPLOY`: dat `false` khi chua co server, dat `true` khi muon auto deploy main.

Them repository secrets khi da co server:

- `DEPLOY_HOST`: IP hoac domain cua server.
- `DEPLOY_USER`: user SSH, vi du `ubuntu`.
- `DEPLOY_PORT`: SSH port, thuong la `22`.
- `DEPLOY_SSH_KEY`: private key dung de SSH vao server.
- `DEPLOY_PATH`: thu muc repo tren server, vi du `/home/ubuntu/zeetcode`.

## Server production can co gi?

Server can cai san:

- Node.js 22;
- npm;
- git;
- pm2;
- Docker;
- Redis;
- cac file `.env` production cho tung service backend.

Script deploy khong tao `.env`. Secrets phai nam tren server hoac duoc quan ly boi provider.

## Lenh deploy lam gi?

`.github/scripts/deploy-production.sh` se:

1. `npm ci` cho tung service backend.
2. `npx tsc --noEmit` de typecheck tung service.
3. start hoac restart cac service bang PM2.
4. `pm2 save` de giu process list sau reboot.

Frontend nen deploy rieng bang Vercel/Netlify/Cloudflare Pages, hoac build va serve bang Nginx neu chay tat ca tren mot VM.

## Luu y quan trong

- Khong bat `ENABLE_DEPLOY=true` neu chua co server va secrets day du.
- CI khong can database that, vi hien tai chi build/typecheck va chay unit test UserService.
- Docker judge can duoc deploy tren may co Docker daemon. Vercel/Render web service thong thuong khong phu hop cho EvaluationService.
