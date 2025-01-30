document.getElementById("getWeatherBtn").addEventListener("click", getWeather);

function getWeather() {
    const city = document.getElementById("city").value;
    const apiKey = "YOUR_API_KEY";  // Replace with your own OpenWeather API key
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.cod === 200) {
                document.getElementById("cityName").innerText = data.name;
                document.getElementById("temperature").innerText = `Temperature: ${data.main.temp} °C`;
                document.getElementById("weatherDescription").innerText = `Weather: ${data.weather[0].description}`;
            } else {
                alert("City not found");
            }
        })
        .catch(error => {
            console.error("Error fetching data: ", error);
            alert("An error occurred while fetching the weather data");
        });
}


const apiUrl = `https://localhost:5001/api/weather?city=${city}`;
