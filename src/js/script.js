//*
//* ----------- -------------
//*

function youAreAlreadyHere() {
  const btn = document.querySelector('.you_already_here');
  let popupClosed = true;

  btn.addEventListener('click', (evt) => {
    evt.preventDefault();
    if (popupClosed) {
      btn.classList.add('you_already_here--active');
      popupClosed = false;

      setTimeout(() => {
        btn.classList.remove('you_already_here--active');
        popupClosed = true;
      }, 5000);
    } else {
      btn.classList.remove('you_already_here--active');
      popupClosed = true;
    }
  });
}

//*
//* ----------- -------------
//*

youAreAlreadyHere();
