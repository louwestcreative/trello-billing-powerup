var t = TrelloPowerUp.iframe();

window.save.onclick = function () {
  t.set('card', 'shared', {
    desc: desc.value,
    togglProject: togglProject.value,
    taskName: taskName.value,
    hours: hours.value,
    workDate: workDate.value,
    dueDate: dueDate.value
  }).then(() => t.closePopup());
};

t.get('card', 'shared').then(data => {
  desc.value = data.desc || "";
  togglProject.value = data.togglProject || "";
  taskName.value = data.taskName || "";
  hours.value = data.hours || "";
  workDate.value = data.workDate || "";
  dueDate.value = data.dueDate || "";
});

// Linked Cards
t.card('attachments').then((attachments) => {
  const container = document.getElementById("linkedCards");

  const links = attachments.filter(a =>
    a.url.includes("trello.com/c/")
  );

  if (links.length === 0) {
    container.innerHTML = "<p>No linked cards.</p>";
    return;
  }

  links.forEach(l => {
    const div = document.createElement("div");
    div.innerHTML = `<a href="${l.url}" target="_blank">${l.name}</a>`;
    container.appendChild(div);
  });
});
