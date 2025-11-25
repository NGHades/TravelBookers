function VehicleCard({vehicle}) {

    function onFavoriteClick()
    {
        alert("favorited")

    }

    // img url
    // make
    // model
    // year
    
    return <div className="vehicle-card">

        <div className="vehicle-image">
            <img src={vehicle.url} alt={vehicle.year + " " + vehicle.make + " " + vehicle.model}/>
            <div className="vehicle-overlay">
                <button className="favorite-btn" onClick={onFavoriteClick}>
                    🤍
                </button>
            </div>
        </div> 

        <div className="vehicle-info">
            <h3>{vehicle.year + " " + vehicle.make + " " + vehicle.model}</h3>    
            <p>{}</p>
        </div>  

    </div>
}

export default VehicleCard