const container = document.getElementById("container");
const showRegister = document.getElementById("showRegister");
const showLogin = document.getElementById("showLogin");
showRegister.addEventListener("click", () => {
    container.classList.add("active");
});
showLogin.addEventListener("click", () => {
    container.classList.remove("active");
});
const toggleButtons = document.querySelectorAll(".toggle-password");
toggleButtons.forEach(button => {
    button.addEventListener("click", () => {
        const input = button.previousElementSibling;
        const icon = button.querySelector("i");
        if (input.type === "password") {
            input.type = "text";
            icon.classList.remove("fa-eye");
            icon.classList.add("fa-eye-slash");
        } else {
            input.type = "password";
            icon.classList.remove("fa-eye-slash");
            icon.classList.add("fa-eye");
        }
    });
});
const registerPassword = document.getElementById("registerPassword");
if (registerPassword) {
    registerPassword.addEventListener("input", () => {
        const value = registerPassword.value;
        let score = 0;
        if (value.length >= 8) score++;
        if (/[A-Z]/.test(value)) score++;
        if (/[0-9]/.test(value)) score++;
        if (/[^A-Za-z0-9]/.test(value)) score++;
        console.log("Password Score:", score);
    });
}
const loginForm = document.getElementById("loginForm");
loginForm.addEventListener("submit", function(e){
    e.preventDefault();
    alert("Đăng nhập thành công!");
});
const registerForm = document.getElementById("registerForm");
registerForm.addEventListener("submit", function(e){
    e.preventDefault();
    alert("Đăng ký thành công!");
});
const inputs = document.querySelectorAll("input");
inputs.forEach(input => {
    input.addEventListener("focus", () => {
        input.parentElement.style.transform = "scale(1.02)";
    });
    input.addEventListener("blur", () => {
        input.parentElement.style.transform = "scale(1)";
    });
});
const buttons = document.querySelectorAll(".btn");
buttons.forEach(btn => {
    btn.addEventListener("mouseenter", () => {
        btn.style.boxShadow = "0 12px 25px rgba(30,58,95,.25)";
    });
    btn.addEventListener("mouseleave", () => {
        btn.style.boxShadow = "none";
    });
});
window.addEventListener("load", () => {
    document.body.style.opacity = "1";
});
