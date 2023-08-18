library(shiny)
library(leaflet)
library(tidyverse)
library(DT)
library(emoji)

mydata <- read_csv("/Users/harshvardhan/Documents/Useful-Files/Misc/Map of Tiny Perfect Things/map-of-tiny-perfect-things/master_data.csv")
mydata$emoji <- ifelse(mydata$type == "Coffee", emoji("coffee"), ifelse(mydata$type == "Pizza", emoji("pizza"), emoji("round_pushpin")))

ui <- navbarPage(title = "Coffee Shop Map",
                 tabPanel("Map", 
                          fluidPage(
                              titlePanel("Map View"),
                              sidebarLayout(
                                  sidebarPanel(
                                      selectizeInput("type", "Type:", choices = unique(mydata$type), selected = "Coffee", multiple = TRUE)
                                  ),
                                  mainPanel(
                                      leafletOutput("mymap")
                                  )
                              )
                          )
                 ),
                 tabPanel("Data", dataTableOutput("table"))
)

server <- function(input, output, session) {
    
    output$mymap <- renderLeaflet({
        data_filtered <- mydata %>% filter(type %in% input$type)
        
        leaflet(data = data_filtered) %>%
            setView(lng = mean(data_filtered$lng, na.rm = TRUE), lat = mean(data_filtered$lat, na.rm = TRUE), zoom = 10) %>%
            addProviderTiles(providers$CartoDB.Positron) %>%
            addMarkers(lng = ~lng, lat = ~lat,
                       popup = ~paste0("<b>", emoji, " ", name, "</b><br>", "Type: ", type, "<br>", 
                                       "Address: ", address, "<br>",
                                       "<a href='", google_maps_link, "'>Google Maps Link</a><br>",
                                       "Google Maps Rating: ", rating, " (", user_ratings_total, " reviews)"))
    })
    
    output$table <- renderDataTable({
        datatable(mydata)
    })
}

shinyApp(ui = ui, server = server)
