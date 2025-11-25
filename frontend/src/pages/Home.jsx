import VehicleCard from "../components/VehicleCard";
import { useState, useEffect } from "react";

function Home() 
{
  // Declare use states here
  const [searchQuery, setSearchQuery] = useState("");

  // TEMP - map to hold vehicles   
  const vehicles = [
    {id: 1, make: "Toyota",     model: "Corolla", year: "2002"},
    {id: 2, make: "Ford",       model: "Focus",   year: "2008"},  
    {id: 3, make: "Volkswagen", model: "Jetta",   year: "2004"},
    {id: 4, make: "Honda",      model: "Pilot",   year: "2012"}
  ]

  // function to handle Searching for vehicles on Home Page
  const handleSearch = async (e) => {
    e.preventDefault();
    alert(searchQuery)
  }

  //  const handleSearch = async (e) => {
  //        e.preventDefault();
  //        // Removes all whitespace to make sure some characters exist in string
  //        if (!searchQuery.trim()) return;
  //        if (loading) return;
  //        
  //        try
  //        {
  //            //  const searchResults = await searchMovies(searchQuery);
  //            //  setMovies(searchResults);
  //            setError(null);
  //        }
  //        catch(err)
  //        {
  //            console.log(err);
  //            setError("Failed to search vehicles...");
  //        }
  //        finally
  //        {
  //            setLoading(false);
  //        }
  //    };

  return ( 
    <div className="home">
      <form onSubmit={handleSearch} className="search-form">
        
        <input 
          type="text" 
          placeholder="Search for vehicles..." 
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <button type="submit" className="search-button">
          Search
        </button>

      </form>

      <div className="vehicles-grid">
        {vehicles.map(
          (vehicle) => 
          (vehicle.year + " " + vehicle.make + " " + vehicle.model).toLowerCase().startsWith(searchQuery) && (
            <VehicleCard vehicle={vehicle} key={vehicle.id}/>
          )
        )}
      </div>
    </div>
  );
}

export default Home;
