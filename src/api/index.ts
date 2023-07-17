import { Router } from "express"
import { 
    getConfigFile, 
    parseCorsOrigins,
  } from "medusa-core-utils"
  import { 
    ConfigModule, 
  } from "@medusajs/medusa/dist/types/global"
  import cors from "cors"
  import { useQuery, useQueryClient } from "@tanstack/react-query";
  const { Pool } = require('pg');


export default (rootDirectory, pluginOptions) => {
  const router = Router()
  
  const { configModule } = 
    getConfigFile<ConfigModule>(rootDirectory, "medusa-config")
  const { projectConfig } = configModule

  const pool = new Pool({
    connectionString: projectConfig.database_url,
  });

  const corsOptions = {
    origin: projectConfig.store_cors.split(","),
    credentials: true,
  }
  
  async function fetchProductIds(categoryId) {
    try {
      const client = await pool.connect();
      
      const query = `
      SELECT *
      FROM product
      WHERE id IN (
        SELECT product_id
        FROM product_category_product
        WHERE product_category_id = $1
      );
    `;
      const values = [categoryId];
      const result = await client.query(query, values);
      const productIds = result.rows;
  
      client.release();
  
      return productIds;
    } catch (error) {
      console.error('Error al obtener los product_id:', error);
      throw error;
    }
  }



  router.options("/store/category-products/:id", cors(corsOptions))
  router.get("/store/category-products/:id", cors(corsOptions), async (req, res) => {
    const id: string = req.params.id;
    try {
      const productIds = await fetchProductIds(id);
  
      res.json({ productIds });
    } catch (error) {
      console.error('Error al obtener los product_id:', error);
      res.status(500).json({ error: 'Error al obtener los product_id' });
    }
  })

  return router
}