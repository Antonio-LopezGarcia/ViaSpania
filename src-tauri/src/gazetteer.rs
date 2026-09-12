use std::path::Path;
#[tauri::command]
pub async fn project_coordinate(
    coordinate: [f64; 2],
    raster_path: Option<String>,
) -> Result<serde_json::Value, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let crs = match raster_path {
            Some(p) => super::raster_epsg(Path::new(&p)).map_err(|e| e.to_string())?,
            None => "EPSG:3857".into(),
        };
        let xy = super::transform_points(&[coordinate], "EPSG:4326", &crs)
            .map_err(|e| e.to_string())?[0];
        Ok(serde_json::json!({"crs":crs,"coordinate":xy}))
    })
    .await
    .map_err(|e| e.to_string())?
}
#[cfg(test)]
mod crs_tests {
    #[test]
    fn existing_gdal_transform_projects_wgs84() {
        if super::super::command_path("gdaltransform").is_none() {
            eprintln!("GDAL no disponible; transformación proyectada no verificada");
            return;
        }
        let p =
            super::super::transform_points(&[[-3., 40.]], "EPSG:4326", "EPSG:25830").unwrap()[0];
        assert!((p[0] - 500000.).abs() < 0.1);
        assert!((p[1] - 4427757.219).abs() < 1.);
    }
}

#[tauri::command]
pub async fn geonames_search(query: String, username: String) -> Result<serde_json::Value, String> {
    if query.trim().chars().count() < 3
        || query.len() > 500
        || username.trim().is_empty()
        || username.len() > 100
    {
        return Err("Revise el usuario de GeoNames y escriba al menos 3 caracteres.".into());
    }
    let response = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .map_err(|_| "No se pudo preparar la conexión con GeoNames.")?
        .get("https://secure.geonames.org/searchJSON")
        .query(&[
            ("q", query.trim()),
            ("username", username.trim()),
            ("maxRows", "40"),
            ("lang", "es"),
            ("style", "FULL"),
            ("isNameRequired", "true"),
        ])
        .send()
        .await
        .map_err(|_| "No se pudo conectar con GeoNames. Compruebe la conexión a Internet.")?;
    if !response.status().is_success() {
        return Err(format!(
            "GeoNames no está disponible (HTTP {}). Inténtelo más tarde.",
            response.status()
        ));
    }
    let text = response
        .text()
        .await
        .map_err(|_| "No se pudo leer la respuesta de GeoNames.")?;
    serde_json::from_str(&text).map_err(|_| "GeoNames devolvió una respuesta inválida.".into())
}
