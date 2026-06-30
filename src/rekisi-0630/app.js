let questions = [];
let index = 0;
let locked = false;

async function loadCategory(name) {
  const res = await fetch(`data/${name}.json`);
  return await res.json();
}

async function startQuiz() {
  const selected = Array.from(
    document.querySelectorAll("input[type=checkbox]:checked")
  ).map(el => el.value);

  if (selected.length === 0) {
    alert("カテゴリを選んでください");
    return;
  }

  let loaded = [];

  for (const cat of selected) {
    const data = await loadCategory(cat);
    loaded = loaded.concat(data);
  }

  // シャッフル
  questions = loaded.sort(() => Math.random() - 0.5);

  document.getElementById("selector").style.display = "none";
  document.getElementById("quiz").style.display = "block";

  index = 0;
  showQuestion();
}

function showQuestion() {
  locked = false;
  const q = questions[index];

  document.getElementById("question").innerText =
    `Q${index + 1}. ${q.question}`;

  const choicesDiv = document.getElementById("choices");
  const feedback = document.getElementById("feedback");

  choicesDiv.innerHTML = "";
  feedback.innerHTML = "";

  q.choices.forEach((c, i) => {
    const div = document.createElement("div");
    div.className = "choice";
    div.innerText = c;

    div.onclick = () => {
      if (locked) return;
      locked = true;

      if (i === q.answer) {
        div.classList.add("correct");
        feedback.innerText = "正解";
      } else {
        div.classList.add("wrong");
        feedback.innerText =
          `不正解（正解：${q.choices[q.answer]}）`;
      }
    };

    choicesDiv.appendChild(div);
  });
}

function nextQuestion() {
  if (index < questions.length - 1) {
    index++;
    showQuestion();
  } else {
    document.getElementById("quiz").innerHTML =
      "<h2>終了！</h2>";
  }
}