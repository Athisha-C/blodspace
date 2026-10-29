// ---------- Simple "database" using localStorage ----------
const store = {
  get: (k, d) => JSON.parse(localStorage.getItem(k)) ?? d,
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};
const currentUser = () => store.get("currentUser", null);

const sample = [
  { id: 1, title: "Getting started with HTML", tag: "HTML", author: "Asha", date: "2026-10-01", body: "HTML gives your page its structure. Start with headings, paragraphs, links, and images." },
  { id: 2, title: "Make layouts with CSS Grid", tag: "CSS", author: "Ravi", date: "2026-10-08", body: "Grid lets you build responsive layouts with just a few lines of CSS." },
  { id: 3, title: "JavaScript events explained", tag: "JavaScript", author: "Meena", date: "2026-10-15", body: "Events let your page react to clicks, typing, and form submissions." },
];
const getPosts = () => store.get("posts", sample);

// ---------- Navbar & footer ----------
function renderNav() {
  const user = currentUser();
  const page = location.pathname.split("/").pop() || "index.html";
  const link = (href, text) => `<li><a href="${href}" class="${page === href ? "active" : ""}">${text}</a></li>`;
  const links = user
    ? link("index.html", "Home") + link("dashboard.html", "Dashboard") + link("create-blog.html", "Create Blog") + `<li><a href="#" id="logout">Logout</a></li>`
    : link("index.html", "Home") + link("login.html", "Login") + `<li><a class="btn" href="register.html">Register</a></li>`;
  document.getElementById("nav").innerHTML =
    `<nav class="navbar"><div class="container"><a class="logo" href="index.html">BlogSpace</a><ul class="nav-links">${links}</ul></div></nav>`;
  document.getElementById("logout")?.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("currentUser");
    location.href = "index.html";
  });
  const f = document.getElementById("footer");
  if (f) f.innerHTML = `<footer class="footer">© 2026 BlogSpace</footer>`;
}

// Escape user text before inserting into HTML
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const postCard = (p) => `<article class="post"><span class="tag">${esc(p.tag)}</span><h3>${esc(p.title)}</h3>
<p>${esc(p.body.slice(0, 110))}${p.body.length > 110 ? "…" : ""}</p><div class="meta">By ${esc(p.author)} on ${esc(p.date)}</div></article>`;

// ---------- Page logic ----------



async function initHome() {
  const postsContainer = document.getElementById("posts");
  const searchInput = document.getElementById("searchInput");
  const clearButton = document.getElementById("clearSearch");

  postsContainer.innerHTML = "Loading blogs...";

  try {
    const response = await fetch("http://localhost:3000/api/blogs");

    if (!response.ok) {
      throw new Error("Failed to load blogs");
    }

    const blogs = await response.json();

    const posts = blogs.map(blog => ({
      id: blog.id,
      title: blog.title,
      body: blog.content,
      tag: blog.tag || "General",
      author: blog.author || "BlogSpace User",
      date: blog.date || new Date().toISOString().slice(0, 10)
    }));

    // Display blog posts
    function displayPosts(filteredPosts) {
      postsContainer.innerHTML = filteredPosts.length
        ? filteredPosts.map(postCard).join("")
        : "No blogs found.";
    }

    // Display all blogs initially
    displayPosts(posts);

    // Search blogs by title
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        const searchText = searchInput.value.trim().toLowerCase();

        const filteredPosts = posts.filter(post =>
          post.title.toLowerCase().includes(searchText)
        );

        displayPosts(filteredPosts);
      });
    }

    // Clear search and display all blogs
    if (clearButton) {
      clearButton.addEventListener("click", () => {
        if (searchInput) {
          searchInput.value = "";
          searchInput.focus();
        }

        displayPosts(posts);
      });
    }

  } catch (error) {
    console.error("Error loading blogs:", error);

    postsContainer.innerHTML =
      "Unable to load blogs. Please check whether the backend is running.";
  }
}



function setError(input, msg) {
  input.closest(".field").querySelector(".error").textContent = msg;
  return !msg;
}


function initRegister() {
  const form = document.getElementById("registerForm");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = form.elements.namedItem("name");
    const email = form.elements.namedItem("email");
    const password = form.elements.namedItem("password");
    const confirm = form.elements.namedItem("confirm");

    const ok = [
      setError(
        name,
        name.value.trim().length < 2 ? "Enter your name." : ""
      ),
      setError(
        email,
        !/^\S+@\S+\.\S+$/.test(email.value.trim())
          ? "Enter a valid email."
          : ""
      ),
      setError(
        password,
        password.value.length < 6
          ? "Use at least 6 characters."
          : ""
      ),
      setError(
        confirm,
        confirm.value !== password.value
          ? "Passwords do not match."
          : ""
      )
    ].every(Boolean);

    if (!ok) return;

    const submitButton = form.querySelector(
      'button[type="submit"]'
    );

    submitButton.disabled = true;

    try {
      const response = await fetch(
        "http://localhost:3000/api/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: name.value.trim(),
            email: email.value.trim(),
            password: password.value
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setError(email, data.message);
          return;
        }

        throw new Error(data.message || "Registration failed.");
      }

      alert("Account created successfully!");
      window.location.href = "login.html";

    } catch (error) {
      console.error("Registration error:", error);
      alert(
        error.message ||
        "Could not connect to the backend. Please try again."
      );
    } finally {
      submitButton.disabled = false;
    }
  });
}



function initLogin() {
  const form = document.getElementById("loginForm");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = form.elements.namedItem("email");
    const password = form.elements.namedItem("password");

    setError(email, "");
    setError(password, "");

    if (!email.value.trim()) {
      setError(email, "Enter your email.");
      return;
    }

    if (!password.value) {
      setError(password, "Enter your password.");
      return;
    }

    const submitButton = form.querySelector(
      'button[type="submit"]'
    );

    submitButton.disabled = true;

    try {
      const response = await fetch(
        "http://localhost:3000/api/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: email.value.trim(),
            password: password.value
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(password, data.message || "Email or password is incorrect.");
        return;
      }

      store.set("currentUser", {
        name: data.user.name,
        email: data.user.email
      });

      location.href = "dashboard.html";

    } catch (error) {
      console.error("Login error:", error);
      setError(
        password,
        "Cannot connect to the backend. Please try again."
      );
    } finally {
      submitButton.disabled = false;
    }
  });
}


function requireLogin() {
  if (!currentUser()) location.href = "login.html";
}



async function initDashboard() {
  requireLogin();

  const user = currentUser();
  document.getElementById("welcome").textContent =
    `Welcome, ${user.name}`;

  const body = document.getElementById("myPosts");
  body.innerHTML = `<tr><td colspan="4">Loading blogs...</td></tr>`;

  let mine = [];

  try {
    const response = await fetch("http://localhost:3000/api/blogs");

    if (!response.ok) {
      throw new Error("Failed to load blogs");
    }

    const blogs = await response.json();

    mine = blogs.filter((blog) => blog.author === user.name);

    document.getElementById("statPosts").textContent = mine.length;
    document.getElementById("statAll").textContent = blogs.length;

    body.innerHTML = mine.length
      ? mine.map((p) => `
          <tr>
            <td>${esc(p.title)}</td>
            <td>${esc(p.tag || "General")}</td>
            <td>${esc(p.date || "—")}</td>
            <td>
              <button class="btn" data-edit-id="${p.id}">Edit</button>
              <button class="btn btn-danger" data-id="${p.id}">Delete</button>
            </td>
          </tr>
        `).join("")
      : `<tr><td colspan="4" class="empty">
          You haven't written anything yet.
          <a href="create-blog.html">Create your first blog</a>.
        </td></tr>`;
  } catch (error) {
    console.error("Dashboard error:", error);
    body.innerHTML =
      `<tr><td colspan="4">Unable to load blogs. Check your backend.</td></tr>`;
    return;
  }

  body.onclick = async (e) => {
    const editButton = e.target.closest("[data-edit-id]");
    const deleteButton = e.target.closest("[data-id]");

    if (editButton) {
      const id = Number(editButton.dataset.editId);
      const blog = mine.find((p) => p.id === id);
      if (!blog) return;

      const newTitle = prompt("Enter the new blog title:", blog.title);
      if (newTitle === null) return;

      const newContent = prompt(
        "Enter the new blog content:",
        blog.content ?? blog.body ?? ""
      );
      if (newContent === null) return;

      if (newTitle.trim().length < 3 || newContent.trim().length < 20) {
        alert("Title must be at least 3 characters and content at least 20 characters.");
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:3000/api/blogs/${id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: newTitle.trim(),
              content: newContent.trim()
            })
          }
        );

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to update blog");
        }

        alert("Blog updated successfully!");
        await initDashboard();
      } catch (error) {
        console.error("Edit error:", error);
        alert(error.message || "Could not update the blog.");
      }

      return;
    }

    if (deleteButton) {
      const id = Number(deleteButton.dataset.id);

      if (!confirm("Are you sure you want to delete this blog?")) {
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:3000/api/blogs/${id}`,
          { method: "DELETE" }
        );

        if (!response.ok) {
          throw new Error("Failed to delete blog");
        }

        await initDashboard();
      } catch (error) {
        console.error("Delete error:", error);
        alert("Could not delete the blog. Please try again.");
      }
    }
  };
}



function initCreate() {
  requireLogin();
  const form = document.getElementById("blogForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const { title, tag, body } = form;
    const ok = [
      setError(title, title.value.trim().length < 3 ? "Title needs at least 3 characters." : ""),
      setError(body, body.value.trim().length < 20 ? "Write at least 20 characters." : ""),
    ].every(Boolean);
    if (!ok) return;
    
const newPost = {
  title: title.value.trim(),
  tag: tag.value,
  body: body.value.trim(),
  author: currentUser().name,
  date: new Date().toISOString().slice(0, 10)
};

fetch("http://localhost:3000/api/blogs", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
 body: JSON.stringify({
  title: newPost.title,
  content: newPost.body,
  author: newPost.author,
  tag: newPost.tag,
  date: newPost.date
})
})
  
.then(async (response) => {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to publish blog");
  }

  return data;
})

  .then(() => {
    document.getElementById("msg").textContent =
      "Published successfully!";
    setTimeout(() => {
      location.href = "dashboard.html";
    }, 900);
  })
  .catch((error) => {
    console.error(error);
    document.getElementById("msg").textContent =
      "Could not publish. Check whether the backend is running.";
  });

  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderNav();
  const init = { home: initHome, register: initRegister, login: initLogin, dashboard: initDashboard, create: initCreate }[document.body.dataset.page];
  init && init();
});
