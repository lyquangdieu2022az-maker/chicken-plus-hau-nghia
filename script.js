// Năm footer
document.getElementById('year').textContent = new Date().getFullYear();

/**
 * DỮ LIỆU MENU
 * ─────────────
 * Hãy sửa/điền 100% giống hệ thống Chicken Plus Việt Nam tại đây.
 * Mỗi mục có: title, items[]. (img là URL ảnh – có thể dùng ảnh trên site tổng)
 */
const menuData = [
  {
    title: "GÀ RÁN / CHIÊN",
    items: [
      { name: "Gà nửa con", price: "139.000", img: "https://images.unsplash.com/photo-1604908176997-4316103b56f5?q=80&w=800&auto=format&fit=crop" },
      { name: "Cánh gà", price: "159.000", img: "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800&auto=format&fit=crop" },
      { name: "Đùi gà", price: "149.000", img: "https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?q=80&w=800&auto=format&fit=crop" }
    ]
  },
  {
    title: "TOKBOKKI / LẨU",
    items: [
      { name: "Tokbokki đỏ", price: "119.000", img: "https://images.unsplash.com/photo-1617093727343-374698b25304?q=80&w=800&auto=format&fit=crop" },
      { name: "Tokbokki đen", price: "119.000", img: "https://images.unsplash.com/photo-1617093727360-cf3c2b2f5f7e?q=80&w=800&auto=format&fit=crop" }
    ]
  },
  {
    title: "MÌ / CƠM / COMBO",
    items: [
      { name: "Mì gà ", price: "59.000", img: "https://images.unsplash.com/photo-1625944525566-4b8c1a7e8f79?q=80&w=800&auto=format&fit=crop" },
      { name: "Combo mì 149k", price: "149.000", img: "https://images.unsplash.com/photo-1505252585461-04db1eb84625?q=80&w=800&auto=format&fit=crop" }
    ]
  },
  {
    title: "ĐỒ UỐNG",
    items: [
      { name: "Trà đào", price: "25.000", img: "https://images.unsplash.com/photo-1541976076758-347942db1970?q=80&w=800&auto=format&fit=crop" },
      { name: "Coca-Cola", price: "15.000", img: "https://images.unsplash.com/photo-1629450931144-18498399a9f8?q=80&w=800&auto=format&fit=crop" }
    ]
  }
];

// Render menu
const root = document.getElementById('menu-root');

menuData.forEach(category => {
  const wrap = document.createElement('section');
  wrap.className = 'category';
  wrap.innerHTML = `
    <h3 class="category-title"><span class="dot"></span> ${category.title}</h3>
    <div class="menu-grid"></div>
  `;
  const grid = wrap.querySelector('.menu-grid');

  category.items.forEach(it => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <img src="${it.img}" alt="${it.name}" onerror="this.style.display='none'">
      <div class="card-body">
        <div>
          <h4 style="margin:0 0 6px">${it.name}</h4>
          <div class="price">${it.price} đ</div>
        </div>
        <div class="actions">
          <a class="btn" href="https://m.me/107847395712282?text=Tôi muốn đặt món: ${encodeURIComponent(it.name)}" target="_blank" rel="noopener">Đặt qua FB</a>
          <a class="btn btn-ghost" href="https://zalo.me/0786340588">Zalo</a>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  root.appendChild(wrap);
});
