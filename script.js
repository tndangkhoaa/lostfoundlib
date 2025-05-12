// Kết nối với Supabase
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
async function loadItems() {
    try {
        itemsList.innerHTML = "<p>Đang tải dữ liệu...</p>";

        const { data, error } = await supabaseClient
            .from('LFLibrary')
            .select('*')    // Lấy tất cả các trường, đảm bảo có `date_reported`
            .order('date_reported', { ascending: false });

        if (error) throw error;

        if (data.length === 0) {
            itemsList.innerHTML = "<p>Không có dữ liệu</p>";
            return;
        }

        // Hiển thị dữ liệu
        itemsList.innerHTML = data.map(item => {
            let displayDate = 'N/A';
            if (item.date_reported) {
                const dateObject = new Date(item.date_reported);
                if (!isNaN(dateObject.getTime())) { // Kiểm tra xem có phải là đối tượng Date hợp lệ không
                    displayDate = dateObject.toLocaleDateString('vi-VN');
                }
            }

            return `
                <div class="item" style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
                    <h3 style="margin-top: 0;">${item.title || 'Không có tiêu đề'}</h3>
                    <p><strong>Vị trí:</strong> ${item.location_found || 'Chưa xác định'}</p>
                    <p><strong>Mô tả:</strong> ${item.description || 'Không có mô tả'}</p>
                    <p><strong>Ngày đăng:</strong> ${displayDate}</p>
                    <!-- Hiển thị ảnh nếu có -->
                    ${item.image_url ? `<img src="${item.image_url}" width="200" style="margin: 10px 0; border-radius: 4px;">` : ''}
                    <p><strong>Liên hệ:</strong> ${item.contact_email || 'Không có'}</p>
                    <p><strong>Trạng thái:</strong> <span style="color: ${item.status === 'Đã nhận' ? 'green' : 'red'}">${item.status || 'Chưa nhận'}</span></p>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
        itemsList.innerHTML = `<p style="color: red;">Lỗi tải dữ liệu: ${error.message}</p>`;
    }
}

// 5. Tải dữ liệu ban đầu khi trang load
document.addEventListener('DOMContentLoaded', () => {
    loadItems();
});
