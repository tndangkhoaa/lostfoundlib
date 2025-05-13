document.addEventListener("DOMContentLoaded", () => {
    // 1. Khởi tạo Supabase Client
    const SUPABASE_URL = 'https://nrsksqrofooddfsiavot.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yc2tzcXJvZm9vZGRmc2lhdm90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMjc3NjgsImV4cCI6MjA2MjYwMzc2OH0.nMWFx8T4r3o5Nu1RfuX07KhpAOlaoj9QQRxTMv9x-8o';
  
    const { createClient } = supabase;
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
  // 2. DOM Elements
const form = document.getElementById("report-form");
const itemsList = document.getElementById("items-list");

// Hàm tải ảnh lên Supabase Storage
async function uploadImage(file) {
    const fileName = Date.now() + "_" + encodeURIComponent(file.name); // Mã hóa URL tên tệp để xử lý ký tự đặc biệt
    const { data, error } = await supabaseClient
        .storage
        .from('images')  // Bucket 'images'
        .upload(fileName, file);

    if (error) {
        console.error("Lỗi tải ảnh:", error.message);
        return null;
    }

    // Lấy URL của ảnh đã tải lên
    const imageUrl = `https://nrsksqrofooddfsiavot.supabase.co/storage/v1/object/public/images/${data.path}`; // Sử dụng data.path thay vì data.Key
    return imageUrl;
}

// 3. Xử lý Submit Form
form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Lấy giá trị từ form
    const formData = {
        title: document.getElementById("title").value,
        description: document.getElementById("description").value,
        location_found: document.getElementById("location").value,
        contact_email: document.getElementById("email").value,
        image_url: document.getElementById("image").files[0] ? await uploadImage(document.getElementById("image").files[0]) : null,
        status: "Chưa nhận", // Trạng thái mặc định
        date_reported: new Date().toISOString() // Thêm ngày giờ hiện tại vào dữ liệu
    };

    try {
        // Thêm dữ liệu vào Supabase
        const { data, error } = await supabaseClient
            .from('LFLibrary')
            .insert([formData])
            .select();

        if (error) throw error;

        alert("Gửi thành công!");
        form.reset();
        await loadItems(); // Tải lại danh sách
    } catch (error) {
        console.error("Lỗi khi gửi dữ liệu:", error);
        alert(`Lỗi: ${error.message}`);
    }
});

// 4. Hàm tải danh sách items
    // 2. Mật khẩu admin đơn giản
    const ADMIN_PASSWORD = "admin123";
    // Kiểm tra trạng thái đăng nhập
    if (localStorage.getItem("isAdminLoggedIn") === "true") {
        showAdminContent();
    }
  
    // Đăng nhập
    window.adminLogin = function () {
        const password = document.getElementById("admin-password").value;
        if (password === ADMIN_PASSWORD) {
            localStorage.setItem("isAdminLoggedIn", "true");
            showAdminContent();
        } else {
            alert("❌ Mật khẩu không đúng!");
        }
    };
  
    // Hiển thị trang admin
    function showAdminContent() {
        document.getElementById("login-section").style.display = "none";
        document.getElementById("admin-content").style.display = "block";
        loadAdminItems();
    }
  
    // Đăng xuất
    window.logoutAdmin = function () {
        localStorage.removeItem("isAdminLoggedIn");
        location.reload();
    };
  
    // Tải dữ liệu từ Supabase
    async function loadAdminItems() {
        try {
            const { data, error } = await supabaseClient
                .from('LFLibrary')
                .select('*')
                .order('date_reported', { ascending: false });

            if (error) throw error;

            const itemsList = document.getElementById("admin-items-list");
            itemsList.innerHTML = "";

            data.forEach(item => {
                const row = document.createElement("tr");

                // Tạo dropdown trạng thái
                const statusSelect = document.createElement("select");
                statusSelect.className = "status-dropdown";
                const statusOptions = ["Chưa nhận", "Đã nhận"];
                statusOptions.forEach(status => {
                    const option = document.createElement("option");
                    option.value = status;
                    option.textContent = status;
                    if (status === item.status) option.selected = true;
                    statusSelect.appendChild(option);
                });
                statusSelect.addEventListener("change", () => updateStatus(item.id, statusSelect.value));

                // Tạo nút xóa
                const deleteBtn = document.createElement("button");
                deleteBtn.textContent = "Xóa";
                deleteBtn.className = "delete-btn";
                deleteBtn.onclick = () => deleteItem(item.id);

                // Xử lý ngày báo cáo theo định dạng ngày/tháng/năm
                const formattedDate = new Date(item.date_reported).toLocaleDateString('vi-VN');

                // Tạo hàng dữ liệu
                row.innerHTML = `
                  <td>${item.id.slice(0, 5)}...</td>
                  <td>${item.title || 'Không có tiêu đề'}</td>
                  <td>${item.image_url ? `<img src="${item.image_url}" alt="Ảnh" style="max-width:60px; border-radius:4px;">` : 'Không có'}</td>
                  <td>${item.location_found || 'Không rõ'}</td>
                  <td>${formattedDate}</td>
                  <td>${item.contact_email || 'Không có'}</td>
                  <td class="status-cell"></td>
                  <td class="action-btns"></td>
                `;
  
                row.querySelector(".status-cell").appendChild(statusSelect);
                row.querySelector(".action-btns").appendChild(deleteBtn);
                itemsList.appendChild(row);
            });
        } catch (err) {
            console.error("Lỗi khi tải dữ liệu:", err);
            alert("Không thể tải dữ liệu: " + err.message);
        }
    }
  
    // Cập nhật trạng thái
    async function updateStatus(id, status) {
        try {
            const { error } = await supabaseClient
                .from('LFLibrary')
                .update({ status })
                .eq('id', id);
            if (error) throw error;
            alert("✅ Trạng thái đã được cập nhật.");
        } catch (err) {
            console.error("Lỗi cập nhật trạng thái:", err);
            alert("❌ Không thể cập nhật trạng thái: " + err.message);
        }
    }
  
    // Xóa item
    async function deleteItem(id) {
        if (!confirm("Bạn có chắc muốn xóa mục này?")) return;
        try {
            const { error } = await supabaseClient
                .from('LFLibrary')
                .delete()
                .eq('id', id);
            if (error) throw error;
            alert("🗑️ Mục đã được xóa.");
            loadAdminItems();
        } catch (err) {
            console.error("Lỗi khi xóa:", err);
            alert("❌ Không thể xóa: " + err.message);
        }
    }
});
