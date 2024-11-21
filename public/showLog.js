const token = localStorage.getItem('token');

        if (token) {
            // Якщо токен є, приховуємо блок авторизації та показуємо інформацію про користувача
            document.getElementById('authBlock').style.display = 'none';
            document.getElementById('profile').style.display = 'inline-block';

        } else {
            // Якщо токена немає, показуємо блок авторизації та приховуємо інформацію про користувача
            document.getElementById('authBlock').style.display = 'inline-block';
            document.getElementById('profile').style.display = 'none';
        }