from flask import Flask, render_template, redirect, request, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import os

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret")
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///var_site.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = "login"


class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    is_admin = db.Column(db.Boolean, default=False, nullable=False)

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)


class News(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    author_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    author = db.relationship("User")


@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))


@app.before_first_request
def init_db():
    db.create_all()
    # создать первого админа, если нет пользователей
    if not User.query.first():
        admin = User(username="admin", is_admin=True)
        admin.set_password(os.environ.get("ADMIN_PASSWORD", "admin123"))
        db.session.add(admin)
        db.session.commit()


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/charter")
def charter():
    return render_template("charter.html")


@app.get("/rules")
def rules():
    return render_template("rules.html")


@app.get("/hierarchy")
def hierarchy():
    return render_template("hierarchy.html")


@app.get("/creators")
def creators():
    return render_template("creators.html")


@app.get("/news")
def news():
    items = News.query.order_by(News.created_at.desc()).all()
    return render_template("news.html", items=items)


@app.route("/admin", methods=["GET", "POST"])
@login_required
def admin():
    if not current_user.is_admin:
        flash("Доступ запрещён")
        return redirect(url_for("index"))
    if request.method == "POST":
        title = request.form.get("title", "").strip()
        text = request.form.get("text", "").strip()
        if title and text:
            item = News(title=title, text=text, author=current_user)
            db.session.add(item)
            db.session.commit()
            flash("Новость опубликована")
            return redirect(url_for("admin"))
        flash("Заполните заголовок и текст")
    items = News.query.order_by(News.created_at.desc()).all()
    return render_template("admin.html", items=items)


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")
        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            login_user(user)
            return redirect(url_for("admin"))
        flash("Неверные данные")
    return render_template("login.html")


@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")
        if not username or not password:
            flash("Заполните все поля")
        elif User.query.filter_by(username=username).first():
            flash("Логин уже занят")
        else:
            user = User(username=username)
            user.set_password(password)
            db.session.add(user)
            db.session.commit()
            flash("Регистрация успешна. Войдите.")
            return redirect(url_for("login"))
    return render_template("register.html")


@app.get("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("index"))


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)


