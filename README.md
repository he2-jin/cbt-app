# 가구제작기능사 CBT

개인용 가구제작기능사 필기시험 CBT 연습 앱.

## 접속 방법

GitHub Pages URL로 접속 후 비밀번호 입력:
- 기본 비밀번호: `1234`
- 변경 방법: `app.js` 첫 줄 `const PASSWORD = '1234';` 수정

## 문제 추가 방법

`questions.js` 파일 열어서 `QUESTIONS` 배열에 추가:

```js
{
  id: 10,               // 기존 마지막 id + 1
  subject: "가구제도",  // "가구제도" | "가구재료" | "가구공작"
  question: "문제 내용",
  image: "",            // 이미지 있으면 "images/파일명.jpg", 없으면 ""
  options: ["보기1", "보기2", "보기3", "보기4"],
  answer: 1,            // 정답 번호 (1~4)
  explanation: "해설"   // 없으면 ""
}
```

이미지 문제: `images/` 폴더에 이미지 파일 저장 후 경로 입력.

## GitHub Pages 배포

```bash
# 1. GitHub에서 새 저장소 생성 후
git remote add origin https://github.com/<계정>/<저장소명>.git
git push -u origin feature/cbt-app

# 2. GitHub 저장소 → Settings → Pages
#    Branch: feature/cbt-app → Save
#
# 3. 약 1~2분 후 접속:
#    https://<계정>.github.io/<저장소명>/
```

## 문제 업데이트 후 배포

```bash
git add questions.js images/
git commit -m "문제 추가"
git push
```
