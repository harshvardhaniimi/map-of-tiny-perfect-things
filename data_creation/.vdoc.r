#
#
#
#
#
#
#
#
#
#
#
#
#
#
#
#
#
library(readr)

create_city_files <- function(csv_path, output_dir) {
  # Load the data
  df <- read_csv(csv_path)
  
  # Get unique city, state, country combinations
  unique_combinations <- unique(df[, c("city", "state", "country")])
  
  # Check if output directory exists, if not create it
  if (!dir.exists(output_dir)) {
    dir.create(output_dir)
  }
  
  # Iterate over each unique combination
  for (i in 1:nrow(unique_combinations)) {
    city <- unique_combinations$city[i]
    state <- unique_combinations$state[i]
    country <- unique_combinations$country[i]
    
    # Filter data for the current combination
    city_data <- df[df$city == city & df$state == state & df$country == country,]
    
    # Start with the header
    text <- sprintf("This document is about City %s in State %s, Country %s.",
                    city, state, country)
    text <- c(text, "Following are some noteworthy places that we'd like to revisit again and again.")
    text <- c(text, "This list is not exhaustive but a collection of things we found awesome. \n \n")
    
    # Iterate over places in the city
    for (j in 1:nrow(city_data)) {
      text <- c(text, 
                sprintf("Name: %s", city_data$name[j]),
                sprintf("City: %s", city_data$city[j]),
                sprintf("State: %s", city_data$state[j]),
                sprintf("Country: %s", city_data$country[j]),
                sprintf("Creator's Rec: %s", city_data$creators_rec[j]),
                sprintf("Notes: %s", city_data$notes[j]),
                sprintf("Address: %s", city_data$address[j]),
                sprintf("Rating: %s with %s ratings", city_data$rating[j], city_data$user_ratings_total[j]),
                sprintf("Google Maps Link: %s", city_data$google_maps_link[j]),
                sprintf("Opening Hours: %s", city_data$opening_hours[j]), "\n\n")
    }
    
    # Save the formatted data into a text file
    file_name <- paste0(gsub(" ", "_", city), "_", state, ".txt")
    writeLines(text, file.path(output_dir, file_name))
  }
}
#
#
#
#
#
create_city_files('master_data/master_data.csv', 'master_data/city_files')
#
#
#
#
